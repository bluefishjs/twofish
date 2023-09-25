# Twofish

A bidirectional manipulation editor for diagramming.

## Target Audience

Scientists, engineers, and science communicators who want to make *illustrated explanatory
diagrams*.

Examples include
- freelance illustrators for Scientific American
- computer scientists in systems and theory
- designers at the Pattern Lab

## Problem Statement

Illustrated explanatory diagrams rely heavily on Gestalt relations to convey information. While many
direct manipulation editors (e.g. Illustrator, Figma) provide ways to author such relations (e.g. alignment
and distribute tools, simple reusable components and color pallettes, arrows that stick to shapes),
it's really hard to modify these relations once they're created. This is a problem, because during
both initial sketching of a design and during refinement, diagram authors often need to make
changes to the Gestalt relations in their diagrams. While such changes can be described as a single
atomic change, because these relations are not stored in the editor they require changing every item
involved in that relation. Moreover, changing one relation may break other downstream relations,
causing an *edit cascade* that can be difficult to manage and time consuming to modify.

## Solution

One promising approach to mitigating this problem is visualizing constraints so they can be directly
manipulated, for example in Figma handles can be dragged to change the spacing between components.

Our approach goes further. Instead of (just) having visualizations of constraints (which can quickly
get cluttered), we expose the scenegraph a user constructs when they make a diagram using Gestalt
relations. In this way, a user can directly modify the relations in their diagram by modifying the
scenegraph. This approach has several advantages:
- The scenegraph can be organized independently of the visual organization of the diagram.
- Nodes can be data-driven, allowing hybrid workflows with both code and direct manipulation. Allows
  for complex conditionals to e.g. adapt to changing screen size. Allows for integrated data
  visualizations.

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.