# Workflows

Folder ini berisi **step-by-step procedures** untuk tasks kompleks.

## Format Workflow

```yaml
---
description: [deskripsi singkat workflow]
---

# [Nama Workflow]

## Prerequisites
- Prerequisite 1
- Prerequisite 2

## Steps

1. Langkah pertama
// turbo (untuk auto-run command tertentu)
2. Langkah kedua auto-run
3. Langkah ketiga manual
```

## Annotations

| Annotation | Fungsi |
|------------|--------|
| `// turbo` | Auto-run step ini saja |
| `// turbo-all` | Auto-run SEMUA steps dalam workflow |

## Slash Commands

User dapat menjalankan workflow dengan format:
```
/nama-workflow
```

Contoh: `/error-recovery`, `/story-dev-qa`
