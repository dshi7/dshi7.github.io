---

title: "First-Principle Note: MMA Layout"
date: 2026-06-26 13:30:00 -0700
categories: [GPU]
tags: [gpu]

---

## Disclaimer

All derivations are personal; all errors are my own.

## 16-bit 16x8x16 Layout

![MMA 16x8x16 Layout](/assets/img/posts/mma-layout/mma_16_8_16.png)

This is the 16x8x16 16-bit MMA layout in tensor core. Starting from first-principle hardware requirements:

1. `mma 16x8x16` is a warp-level instruction => the matrices are split across 32 threads
2. Each register is 32-bit => holds 2 horizontal elements (a 1x2 strip) per register
3. The output matrix has 16x8 = 128 elements => 4 elements/thread (i.e., 2 registers/thread)

Given #2 and #3, a natural question arises: if a thread holds 4 elements and each register holds a 1x2 horizontal strip, why does the hardware split those strips across different rows (e.g., Row 0 and Row 8) instead of placing them side-by-side in the same row to form a clean, contiguous 1x4 strip?

The answer lies in a fourth hardware fact:

4. The hardware handles the K-dimension sequentially across clock cycles => 2 steps here