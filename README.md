# Пастырская конференция — One-Page Website

A single-page conference website. All content lives in editable Markdown files under `content/` — the page loads them at runtime, so you never need to touch the HTML to update texts.

## Editing content

Replace the `[PLACEHOLDER]` texts in these files with your real data:

| File | Section | Format |
| --- | --- | --- |
| `content/general.md` | Title, dates, venue, contacts, registration link | `key: value` lines |
| `content/speakers.md` | Speakers grid | `## Name`, `### Church`, then a short bio paragraph |
| `content/schedule.md` | Program | `## Day heading`, then list items `- 14:00 — Event` |
| `content/seminars.md` | Seminar speakers | `## Language group`, then `- Speaker — Topic` |
| `content/prices.md` | Prices | `## Group heading`, optional `> note`, then a Markdown table; a line starting with `*` becomes the footnote |
| `content/location.md` | Venue & travel | `## Subheading`, then paragraphs or lists |
| `content/gallery.md` | Photo gallery | List of image paths, e.g. `- images/photo-1.jpg` |
| `content/about.md` | About | Plain paragraphs |

### Speaker photos & gallery images

Put images into an `images/` folder. Gallery: reference them in `content/gallery.md`. Missing images show a gray `[ФОТО]` placeholder automatically. Speaker cards currently show initials as placeholders.

## Local preview

The page fetches the Markdown files, so open it via a local server (not `file://`):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deployment

Hosted on GitHub Pages from the `main` branch — every push to `main` updates the live site.
