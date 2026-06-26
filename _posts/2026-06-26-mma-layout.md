---
title: "My First-Principle Note: MMA Layout"
date: 2026-06-26 13:30:00 -0700
categories: [GPU]
tags: [gpu, mma, matrix, cuda]
image:
  path: /assets/img/posts/mma-layout/
---

<!-- Drop your screenshots into assets/img/posts/mma-layout/ and reference them below -->
<!-- Example: ![Description](/assets/img/posts/mma-layout/your-screenshot.png) -->

## Disclaimer

All derivation personal, all errors my own.

## 16-bit 16x8x16 Layout

![MMA 16x8x16 Layout](/assets/img/posts/mma-layout/mma_16_8_16.png)

This is a 16x8x16 16-bit MMA layout in tensor core. Starting from the first principle HW requirements:
#1. mma 16x8x16 is a warp level instruction => split matrixes to 32 threads
#2. each register is 32-bit => hold 2 horizontal element (1x2 strip) /register
#3. output matrix has 16x8 elements => 4 element/hread (i.e. 2 register/thread)

Gven #2 and #3, need to decide, if a thread holds 4 elements, and each register holds a 1x2 horizontal strip, why does the hardware split those strips across different rows (like Row 0 and Row 8) instead of putting them side-by-side in the same row to make a clean, contiguous 1x4 strip?

HW fact:
#4. hardware handles the K-dimension sequentially across clock cycles => 2 steps here