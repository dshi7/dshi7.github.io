---

title: "First-Principle Note: Layout"
date: 2026-06-26 13:30:00 -0700
categories: [GPU]
tags: [gpu]

---

## Disclaimer

All derivations are personal; all errors are my own.

## Topic

This blog explains my understanding about hardware layout (ground truth) and popular layout systems (representations).

### Build picture from the ground up

**HW enforcement: ISA mandates fragment layout of instruction like ldmatrix and mma**

Landscape of layout:

- memory access pattern (coalesced/sequential for GMEM and swizzled for SMEM)
- compute acess pattern (hardware mandated 'zig-zag' matrix fragments)

Another dimension:

- data layout (where data sits): matrix coordinate (row, col) => physical location
- thread layout (which thread does what): thread ID => matrix coordinate (row, col)

Access pattern is the math composition to bridge between thread layout and data layout.

**Clarify a few ambiguity.** 

- **Physical SMEM location: e.g. bank #0, offset 128**
- **Physical register location: e.g. thread 0, register R2**
- **Logical location: e.g. matrix[0][0]**

Hardware mandates (tensor core) which physical registers

Tensor core fragment layout (hardware enforcement) mandates the mapping from logical location to physical register location but **compiler needs to engineer *SMEM data layout*, which maps  logical location to physical SMEM location**

Mapping from physical SMEM location to physical register location is determined by ISA but selected by compiler

## Swizzling layout (SMEM)

Hardware background:

- SMEM is sliced vertically into 32 banks (parallel hardware channels). 
- Each bank only reads/writes 4B per clock cycle.

Example: 16x32 32-bit

### Unswizzled

![unswizzled](/assets/img/posts/gpu-memory-model/unswizzled.png)

To clarify, we should read it in this way. 
For example, B10 at row=2/col=10 means the 32-bit element at Matrix[2][10] sits at bank 10 in SMEM.

- Row-read: ideal conflict-free.
- Col-read: one wrap reads 32 elements in first two columns and cause massive bank conflict because each columns entirely sites in one bank.

### Swizzled (thread ID = column ID ^ row ID)

![swizzled](/assets/img/posts/gpu-memory-model/swizzled.png)

In the previous example of col-read, 16 elements in col 0 sit in 16 different banks (0\~15) so can be accessed simulationeouly.

```javascript
baseline:	000		001		010		011		100		101		110		111
^0b001		001		000		011		010		101		100		111		100		# swap every two cells
^0b010		010		011		000		001		110		111		100		101
^0b011		011		010		001		000		111		110		101		100
```

By inspection, it's easily seen that:

- For each row, thread ID allocation is a permutation (no more; no less)
- For each col, each thread 