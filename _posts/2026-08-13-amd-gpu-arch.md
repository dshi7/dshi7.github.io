---
layout: post
title: "First-Principle Note: AMD gfx950"
date: 2026-08-13 14:45:00 -0700
categories: [GPU]
tags: [AMD, CDNA, Architecture]
---

This self-study note is a first-principles note to build an intuition for AMD gfx950 from the hardware up. Not a complete tech documentation.

# Occupancy

- 1 CU contains 4 SIMD and a 160-KB LDS
- 1 SIMD contains instruction scheduler supporting 8 resident waves with 512 VGPR/AGPR and 800 SGPR.

Occupancy describes resident waves / max resident waves. For example, 4-wave workgroup / 128 VGPR per lane / 32 KB LDS usage / ...
- VGPR: 512/128 = 4 waves/SIMD
- LDS: 160/32 = 5 workgroup/CU = 5 workgroup/CU * (1 CU/4 SIMD) * (4 waves/workgroup) = 5 waves/SIMD
- Occupancy = min(4 waves/SIMD, 5 waves/SIMD, ...) / (8 waves/SIMD) = 50%

Reference: https://rocm.blogs.amd.com/software-tools-optimization/occupancy-math-mi355x/README.html

# Memory route (A/B operands -> MFMA)

Classic (HBM -> VGPR -> LDS -> VGPR -> MFMA)
- **1st VGPR register layout** is coalescing-driven honoring global address pattern. Each lane holds a contiguous vector.
- **LDS layout** is bank-conflict-driven designed by compiler. Nominally row-major, plus a swizzle or padding. Making both write and read land across distinct banks.
- **2nd VGPR register layout** is hardware-mandated by the MFMA fragment mapping.

![gfx950_classic_memory_route_mfma](/assets/img/posts/tlx/gfx950_classic_memory_route_mfma.png)

gfx950 async (HBM → LDS → VGPR → MFMA)
- `buffer_load_to_lds` allows direct-to-LDS movement and reduces register pressure.

![gfx950_async_load_direct_to_lds](/assets/img/posts/tlx/gfx950_async_load_direct_to_lds.png)

# 

To be continued...