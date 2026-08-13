---
layout: post
title: "First-Principle Note: AMD GPU Architecture"
date: 2026-08-13 14:45:00 -0700
categories: [GPU]
tags: [AMD, CDNA, Architecture]
---

This self-study note is a first-principles note to build an intuition for AMD GPU architecture from the hardware up. Not a complete tech documentation.

# Hardware facts

- 1 CU contains 4 SIMD and a 160-KB LDS (L1 cache)
- 1 SIMD contains instruction scheduler supporting 8 resident waves with 512 VGPR/AGPR and 800 SGPR.

Occupancy describes what % waves are active. For example, 4-wave workgroup / 128 VGPR per lane / 32 KB LDS usage / ...
- VGPR: 512/128 = 4 waves/SIMD
- LDS: 160/32 = 5 workgroup/CU = 5 workgroup/CU * (1 CU/4 SIMD) * (4 waves/workgroup) = 5 waves/SIMD
- Occupancy = min(4 waves/SIMD, 5 waves/SIMD, ...) / (8 waves/SIMD) = 50%

To be continued...