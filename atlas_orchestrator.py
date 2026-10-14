#!/usr/bin/env python3
"""
Atlas Orchestrator — v1.0
-------------------------
Charge atlas-agents-io.json (ou atlas-agents.json) et fournit :
- un registre d'agents avec spécifications I/O
- la recherche par tag / scope
- le routage automatique d'une tâche
- les pipelines prédéfinis (jeu-2d / web / data)
- la traversée des chaînes de handoff
- l'affichage des schémas d'entrées/sorties (--io)
- un moteur d'invocation LLM (stub local ou Gemini API via GEMINI_API_KEY)

Usage :
    python atlas_orchestrator.py --list
    python atlas_orchestrator.py --route "créer un système de combat" --scope jeu
    python atlas_orchestrator.py --pipeline jeu-2d
    python atlas_orchestrator.py --handoff GameplayCrafter
    python atlas_orchestrator.py --io GameDirector
    python atlas_orchestrator.py --invoke GameDirector --task "Concevoir un jeu cyberpunk"
"""

from __future__ import annotations

import argparse
import json
import os
import urllib.request
from collections import deque
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

DEFAULT_CATALOG_IO = Path(__file__).parent / "atlas-agents-io.json"
DEFAULT_CATALOG_RAW = Path(__file__).parent / "atlas-agents.json"
CATALOG_PATH = DEFAULT_CATALOG_IO if DEFAULT_CATALOG_IO.exists() else DEFAULT_CATALOG_RAW

VETO_AGENTS = {"LegalLiaison", "SecuritySentinel", "QAOverlord"}


# ──────────────────────────────────────────────────────────────
# Modèle
# ──────────────────────────────────────────────────────────────
@dataclass
class Agent:
    id: str
    name: str
    desc: str
    instructions: str
    tags: list[str]
    style: str
    temperature: float
    primer: str
    scope: list[str]
    handoff: list[str]
    memPrio: int = 3
    version: str = "1.0"
    veto: bool = False
    merged_from: list[str] = field(default_factory=list)
    io: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "Agent":
        return cls(
            id=d["id"],
            name=d["name"],
            desc=d["desc"],
            instructions=d["instructions"],
            tags=d.get("tags", []),
            style=d.get("style", ""),
            temperature=float(d.get("temperature", 0.5)),
            primer=d.get("primer", ""),
            scope=d.get("scope", []),
            handoff=d.get("handoff", []),
            memPrio=int(d.get("memPrio", 3)),
            version=d.get("version", "1.0"),
            veto=d["name"] in VETO_AGENTS,
            merged_from=d.get("mergedFrom", []),
            io=d.get("io", {}),
        )


# ──────────────────────────────────────────────────────────────
# Orchestrateur
# ──────────────────────────────────────────────────────────────
class AtlasOrchestrator:
    def __init__(self, path: Path = CATALOG_PATH) -> None:
        resolved_path = Path(path).resolve()
        if not resolved_path.exists():
            if DEFAULT_CATALOG_IO.exists():
                resolved_path = DEFAULT_CATALOG_IO
            elif DEFAULT_CATALOG_RAW.exists():
                resolved_path = DEFAULT_CATALOG_RAW
            else:
                raise FileNotFoundError(f"Catalogue Atlas introuvable: {path}")

        data = json.loads(resolved_path.read_text(encoding="utf-8"))
        self.meta = data.get("meta", {})
        self.agents: dict[str, Agent] = {
            a["name"]: Agent.from_dict(a) for a in data["agents"]
        }
        self._index_tags()

    # ── Index ──────────────────────────────────────────────────
    def _index_tags(self) -> None:
        self.by_tag: dict[str, list[str]] = {}
        for agent in self.agents.values():
            for tag in agent.tags:
                self.by_tag.setdefault(tag.lower(), []).append(agent.name)

    # ── Recherche ──────────────────────────────────────────────
    def find(
        self,
        tag: Optional[str] = None,
        scope: Optional[str] = None,
    ) -> list[Agent]:
        names: set[str] = set()
        if tag:
            names.update(self.by_tag.get(tag.lower(), []))
        results = []
        for name in names or self.agents.keys():
            agent = self.agents[name]
            if scope and scope not in agent.scope:
                continue
            results.append(agent)
        return sorted(results, key=lambda a: a.name)

    # ── Routage ────────────────────────────────────────────────
    def route(
        self,
        task: str,
        scope: Optional[str] = None,
        top_k: int = 3,
    ) -> list[Agent]:
        """Score chaque agent selon les mots-clés de la tâche."""
        words = {w.lower() for w in task.split() if len(w) > 2}
        scored: list[tuple[float, Agent]] = []
        for agent in self.agents.values():
            if scope and scope not in agent.scope:
                continue
            score = 0.0
            # matching tags
            for tag in agent.tags:
                tag_lower = tag.lower()
                if tag_lower in words or any(tag_lower in w for w in words):
                    score += 2.5
            # matching name
            if agent.name.lower() in task.lower():
                score += 5.0
            # matching desc
            desc_lower = agent.desc.lower()
            for w in words:
                if w in desc_lower:
                    score += 1.5
            # matching instructions
            instr_lower = agent.instructions.lower()
            for w in words:
                if w in instr_lower:
                    score += 1.0

            if score > 0:
                scored.append((score, agent))

        scored.sort(key=lambda t: (-t[0], t[1].name))
        return [a for _, a in scored[:top_k]]

    # ── Chaîne de handoff (BFS) ────────────────────────────────
    def handoff_chain(
        self,
        start: str,
        max_depth: int = 4,
    ) -> list[list[str]]:
        """Retourne toutes les chaînes de handoff à partir d'un agent."""
        if start not in self.agents:
            raise ValueError(f"Agent inconnu : {start}")
        chains: list[list[str]] = []
        queue: deque[list[str]] = deque([[start]])
        while queue:
            path = queue.popleft()
            if len(path) >= max_depth:
                chains.append(path)
                continue
            last = path[-1]
            nexts = self.agents[last].handoff
            added = 0
            if nexts:
                for nxt in nexts:
                    if nxt in self.agents and nxt not in path:
                        queue.append(path + [nxt])
                        added += 1
            if added == 0 and len(path) > 1:
                chains.append(path)
        return chains

    # ── Pipelines prédéfinis ───────────────────────────────────
    def pipeline(self, project_type: str) -> list[Agent]:
        pipelines = {
            "jeu-2d": [
                "Brainstormer", "GameDirector", "GameMechanic",
                "TechStackAdvisor", "EngineWhisperer", "CoreArchitect",
                "Prototyper", "GameplayCrafter", "AIStrategist",
                "PhysicsGuru", "PixelCrafter", "AnimationMaestro",
                "SoundSculptor", "UIAlchemist", "UIXpert",
                "NetworkNinja", "SecuritySentinel", "PerfOptimizer",
                "DebugNinja", "QAOverlord", "LocalizationGuru",
                "MonetizationMaven", "LegalLiaison", "DevOpsDynamo",
                "CommunityChampion",
            ],
            "web": [
                "Brainstormer", "GameDirector", "TechStackAdvisor",
                "ArchitecteWeb", "UIAlchemist", "UIXpert",
                "CodeSculptor", "Atlas_DataAnalyst", "DataAlchemist",
                "SecuritySentinel", "PerfOptimizer", "DebugNinja",
                "QAOverlord", "LocalizationGuru", "MonetizationMaven",
                "LegalLiaison", "DevOpsDynamo", "CommunityChampion",
            ],
            "data": [
                "GameDirector", "CoreArchitect", "DataAlchemist",
                "Atlas_DataAnalyst", "SecuritySentinel",
                "PerfOptimizer", "QAOverlord", "LegalLiaison",
            ],
        }
        if project_type not in pipelines:
            raise ValueError(
                f"Pipeline inconnu : {project_type}. "
                f"Disponibles : {list(pipelines)}"
            )
        return [self.agents[n] for n in pipelines[project_type]]

    # ── Invocation (avec fallback stub ou Gemini API) ──────────
    def build_prompt(self, agent_name: str, task: str, context: str = "") -> str:
        agent = self.agents[agent_name]
        io_spec = json.dumps(agent.io, indent=2, ensure_ascii=False) if agent.io else "Non spécifié"
        return (
            f"# Agent : {agent.name}\n"
            f"# Rôle : {agent.desc}\n"
            f"# Style : {agent.style} | Temp : {agent.temperature}\n"
            f"# Scope : {', '.join(agent.scope) or 'n/a'}\n"
            f"# Primer : {agent.primer}\n\n"
            f"## Instructions\n{agent.instructions}\n\n"
            f"## Spécification I/O (JSON Schema)\n{io_spec}\n\n"
            f"## Contexte\n{context or '(aucun)'}\n\n"
            f"## Tâche\n{task}\n"
        )

    def invoke(self, agent_name: str, task: str, context: str = "", live: bool = False) -> dict[str, Any]:
        """Invoque l'agent via son profil. Si live=True et clé Gemini présente, appelle Gemini."""
        prompt = self.build_prompt(agent_name, task, context)
        api_key = os.environ.get("GEMINI_API_KEY", "")

        if live and api_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
                req_body = json.dumps({
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": self.agents[agent_name].temperature}
                }).encode("utf-8")
                req = urllib.request.Request(url, data=req_body, headers={"Content-Type": "application/json"})
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    return {
                        "agent": agent_name,
                        "temperature": self.agents[agent_name].temperature,
                        "prompt": prompt,
                        "output": text or f"Réponse vide pour {agent_name}",
                        "live": True
                    }
            except Exception as e:
                return {
                    "agent": agent_name,
                    "temperature": self.agents[agent_name].temperature,
                    "prompt": prompt,
                    "output": f"[Erreur API Gemini: {e}] Mode stub activé.",
                    "live": False
                }

        # Mode Stub par défaut
        return {
            "agent": agent_name,
            "temperature": self.agents[agent_name].temperature,
            "prompt": prompt,
            "output": f"[STUB] {agent_name} a traité : {task[:60]}...",
            "live": False
        }

    # ── Exécution d'un pipeline ────────────────────────────────
    def run_pipeline(
        self,
        project_type: str,
        initial_task: str,
        live: bool = False
    ) -> list[dict[str, Any]]:
        results = []
        context = initial_task
        for agent in self.pipeline(project_type):
            out = self.invoke(agent.name, initial_task, context=context, live=live)
            results.append(out)
            context = out["output"]
        return results


# ──────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────
def main() -> None:
    parser = argparse.ArgumentParser(description="Atlas Orchestrator")
    parser.add_argument("--list", action="store_true", help="Liste les agents")
    parser.add_argument("--route", type=str, help="Tâche à router")
    parser.add_argument("--scope", type=str, choices=["jeu", "web"], default=None)
    parser.add_argument("--pipeline", type=str, help="jeu-2d | web | data")
    parser.add_argument("--handoff", type=str, help="Agent de départ")
    parser.add_argument("--io", type=str, help="Affiche le schéma I/O de l'agent spécifié")
    parser.add_argument("--invoke", type=str, help="Nom de l'agent à invoquer")
    parser.add_argument("--task", type=str, default="Présente tes préconisations pour le projet.", help="Tâche pour --invoke")
    parser.add_argument("--live", action="store_true", help="Active l'appel direct Gemini API si clé disponible")
    args = parser.parse_args()

    orch = AtlasOrchestrator()

    if args.list:
        print(f"{'Nom':<22} {'Temp':<6} {'Scope':<12} {'I/O':<5} Veto")
        print("─" * 60)
        for a in sorted(orch.agents.values(), key=lambda x: x.name):
            has_io = "✔" if a.io else ""
            print(
                f"{a.name:<22} {a.temperature:<6} "
                f"{','.join(a.scope):<12} {has_io:<5} {'✔' if a.veto else ''}"
            )

    if args.io:
        if args.io not in orch.agents:
            print(f"❌ Agent introuvable : {args.io}")
        else:
            agent = orch.agents[args.io]
            print(f"\n📦 Schéma I/O pour l'agent {agent.name} :")
            print(json.dumps(agent.io, indent=2, ensure_ascii=False))

    if args.route:
        matches = orch.route(args.route, scope=args.scope)
        print(f"\n🎯 Agents suggérés pour : « {args.route} »")
        for a in matches:
            print(f"  • {a.name} (temp {a.temperature}) — {a.desc}")

    if args.pipeline:
        print(f"\n📋 Pipeline : {args.pipeline}")
        for i, a in enumerate(orch.pipeline(args.pipeline), 1):
            print(f"  {i:>2}. {a.name}")

    if args.handoff:
        chains = orch.handoff_chain(args.handoff)
        print(f"\n🔗 Chaînes de handoff depuis {args.handoff} :")
        for c in chains:
            print("  → " + " → ".join(c))

    if args.invoke:
        res = orch.invoke(args.invoke, args.task, live=args.live)
        print(f"\n🤖 Invocation de {args.invoke} :")
        print(f"Sortie : {res['output']}")


if __name__ == "__main__":
    main()
