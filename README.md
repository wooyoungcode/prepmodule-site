# PrepModule — site

Static site: admissions guidance and SAT / AP tutoring for students preparing for US universities.
Plain HTML / CSS / JS, no build step.

## Run locally

```bash
python3 -m http.server 4321
```

Then open `http://localhost:4321/`.

## Configuration

`assets/data.js` holds the public lists (officers, tutors, SAT areas, AP subjects) and the request-form endpoint:

```js
submit: { endpoint: '' }   // URL that accepts a JSON POST — until set, the forms show a "not connected" message and send nothing
```

## Pages

| Path | Page |
| --- | --- |
| `/` | Home |
| `/admissions/` | Admissions conversations |
| `/tutoring/sat/` · `/tutoring/ap/` | SAT / AP tutoring |
| `/request/` | Request form (Admissions / SAT / AP — `?service=admissions`, `?subject=sat|ap`, plus `area` / `apSubject` / `expertId`) |
| `/request/admissions/` · `/request/tutoring/` | Forward to `/request/` with parameters kept |
