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

I would first figure out the first-principled story about layout, what is hardware/ISA mandated (immutable) and what is compiler's optimization art (mutable).

Case 1. `ldmatrix` to load matrix from SMEM for mma instruction

Notice that **ISA mandates fragment layout for ldmatrix.** When `ldmatrix` or `ldmatrix.trans` invokes, it's mandated that exactly which threads get which elements. 

Also notice the **hardware fact that SMEM is splitted into 32 banks** to improve access concurrency. If same column sits in same bank, its col-read will cause bank conflict though not hurting correctness. **Swizzling layout is proposed to make it fast instead of make it work.** The math features of swizzling layout will be discussed later.

![ldmatrix fragment layout](/assets/img/posts/mma-layout/ldmatrix-fragment-layout.png)

Case 2. `tcgen05{.ld,.st}` to load matrix from SMEM to TMEM

Similarly ISA mandates thread fragment layout in TMEM. 

![tcgen05 fragment layout](/assets/img/posts/mma-layout/tcgen05-fragment-layout.png)

## Swizzling layout (SMEM)

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

1. For each row, thread ID allocation is a permutation (no more; no less). By XOR a number, some certain bits are flipped. Due to POT width, all combinations of 0101 are available so flipping bits can be seen as swapping of pairs.
2. For each col, elements are stored in different banks so that they can be accessed without bank conflict. An intuitative view though not rigorous math proof is that, any two elements in same col are its original value (same) XOR their row ID (different) so must be different.