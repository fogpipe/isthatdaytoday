default:
    @just --list

release:
    wrangler pages deploy public --project-name=isthatdaytoday
