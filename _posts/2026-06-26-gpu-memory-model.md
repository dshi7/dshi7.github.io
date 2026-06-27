---

title: "First-Principle Note: GPU Memory Model"
date: 2026-06-26 15:18:00 -0700
categories: [GPU]
tags: [gpu, memory, cuda]

---

# Goal: Build everything from the ground up like math

Slow is smooth; smooth is fast.

All derivations are personal; all errors are my own.

Style: Axiom if enforced by hardware arch or compiler design otherwise Proposition/Lemma

## Fundamental of CTA, warp, thread

**Axiom 1. SASS ISA determines 256 32-bit register/thread.**

Physical fact. Exactly 8 bits in SASS instruct for register addressing.

**Axiom 2. GPU SIMT model determines 32 thread/warp.**
Single instruction decoder that controls a vector unit with 32 execution lanes (comp arch design). Modern instructions like wgmma simply take advantage of this pre-existing hardware grouping.

**Proposition 1. All 32 threads share same PC and only differ at memory offset by laneID.**

RE control flow, PTXAS uses inst-level mask however in some cases uses a uniform warp branch to jump.

**Proposition 2. All threads in CTA run the same SASS and different warps have different PCs.**

When compiler finishes generating SASS, number of registers used by any single thread at any point is determined.

## Tensor core, MMA

**Axiom 3. RF is splitted into banks[0:3]. Each serves one read request per clock cycle.**

Similar to more known SMEM bank, threads accessing same bank cause *bank conflict* and stall execution.

Threads are mapped to banks in a *sequential, interleaved* pattern:

- Bank 0: T0, T4, T8, T12, ...
- Bank 1: T1, T5, T9, T13, ...
- Bank 2: T2, T6, T10, T14, ...
- Bank 3: T3, T7, T11, T15, ...

**Axiom 4. Crossbar is wire array and mux feeding operands (sitting in RF banks) to execution pipelines (ALU and Tensor Core)**

2-to-1 MUX is always preferred to avoid crossbar choke because 4-to-1 MUX is too HW expensive.

**Axiom 5.** **(Hopper) A can be either in RF or SMEM; B has to be in SMEM; C must entirely sit in threads' registers.**

**Proposition 3. In the thread register layout of MMA, each thread owns exactly 2 columns in C.**

This is because (1) B is sliced across distinct threads and (2) 2-to-1 MUX.

**Axiom 6.** **(Hopper) 4 sub-cores. each handles 64 FMAs (16-bit) per cycle.**
![MMA 16x8x16 Layout](/assets/img/posts/mma-layout/mma_16_8_16.png)

**Axiom 7. (Blackwell)** **256KB** **TMEM (128 lanes, 512 columns, 4-byte cells) sitting on top of tensor cores to bypass thread registers entirely**

Hopper MMA constraints like 64-bit crossbar bus, 2-to-1 MUX and RF bank conflicts are completely evaporate.

By introducing additional 256KB TMEM, it's easier for the original 256KB RF to handle non-matrix tasks (LN, softMax, RoPE) because MMA (A/B/C) no longer needs RF during matmul exeuction.

| Operand | wgmma | tcgen05.mma |
| --- | --- | --- |
| A | SMEM or RF | SMEM or TMEM |
| B | SMEM | SMEM or TMEM |
| C | RF | TMEM |

tcgen05 is meticulously designed to *maximize spatial utilization* of TMEM regardless of matrix shape via structural packing layouts.

**Proposition 4. TMEM supports 2D matrix layout: (row, col)=>(TMEM lane, TMEM col)**

The concept of 'which thread owns this element' is wiped. 

**Proposition 5. TMEM makes epilogue  more flexible and faster**

1-D thread register layout shatters same row to different threads (to avoid heavy MUX) and requires extra data shuffling (extra ALU cycles and register pressure), massive bank conflict. However, 2-D maps thread ID cleanly to TMEM row, a perfectly continuous linear block, and can fire highly optimized vectorized memory store.

## SMEM

**Axiom 8. SMEM is sliced vertically into 32 banks (parallel hardware channels). Each bank only reads/writes 4B per clock cycle**

The number of 32 matches the thread number in a warp with an ideal conflict-free acesses.

![SMEM banks](/assets/img/posts/gpu-memory-model/SMEM banks.png)

Bank conflict happens when multiple lanes access different addresses to the same bank.