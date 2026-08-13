---
layout: post
title: "TLX GEMM + Activation for AMD CDNA4"
date: 2026-08-12 19:04:00 -0700
categories: [GPU]
tags: [AMD, CDNA4, GEMM, TLX, Activation]
---

## TL;DR

TLX on CDNA4 enables efficient fused GEMM + activation by improving data movement and utilization across the memory hierarchy.

This blog is a self-study note of [this tech blog](https://www.amd.com/en/developer/resources/technical-articles/2026/optimizing-gemm-with-tlx.html)

## V1 Register Staged

When stock Triton does `tl.dot(tl.load(...), tl.load(...), ...)`, the Triton compiler silently inserts LDS allocations and layout conversion code under the hood. TLX (v1 kernel) illustrates the implementation explicitly as below.

![amd_addmm_glu_v1_register_staged](/assets/img/posts/tlx/amd_addmm_glu_v1_register_staged.png)

## V2 Async Load

TLX exposes async load (HBM->LDS).
- Prev: tl.load HBM->VGPR (blocking) + tlx.local_store VGPR->LDS (blocking)
- Now: tlx.async_load HBM->LDS (non-blocking)

![amd_addmm_glu_v2_async_load](/assets/img/posts/tlx/amd_addmm_glu_v2_async_load.png)

