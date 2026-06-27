---

title: "First-Principle Note: GPU Memory Model"
date: 2026-06-26 15:18:00 -0700
categories: [GPU]
tags: [gpu, memory, cuda]

---

## Disclaimer

All derivations are personal; all errors are my own.

## Principle: Axiom if HW/Compiler determines otherwise Proposition/Lemma

**Axiom 1. SASS ISA determines 256 32-bit register/thread**

Physical facts.

**Axiom 2. GPU SIMT model and 32 thread/warp**
Single instruction decoder that controls a vector unit with 32 execution lanes (comp arch design). Modern instructions like wgmma simply take advantage of this pre-existing hardware grouping.

**Proposition 1. All 32 threads share same PC and only differ at memory offset by laneID**

RE control flow, PTXAS uses inst-level mask however in some cases uses a uniform warp branch to jump.

**Proposition 2. All threads in CTA run the same SASS and different warps have different PCs**
