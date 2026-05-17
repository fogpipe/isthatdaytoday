default:
    @just --list

start:
    caddy run --config Caddyfile

deps:
    deno install --node-modules-dir=auto

release: deps
    wrangler pages deploy public --project-name=isthatdaytoday

tf *args:
    tofu -chdir=infra {{args}}

tf-init:
    tofu -chdir=infra init

tf-plan:
    tofu -chdir=infra plan

tf-apply:
    tofu -chdir=infra apply

tf-import:
    tofu -chdir=infra import cloudflare_pages_project.site 5e40be226ed237f6ec2ca9ea2af6f855/isthatdaytoday
    tofu -chdir=infra import cloudflare_pages_domain.apex 5e40be226ed237f6ec2ca9ea2af6f855/isthatdaytoday/isthatday.today
    tofu -chdir=infra import cloudflare_pages_domain.www 5e40be226ed237f6ec2ca9ea2af6f855/isthatdaytoday/www.isthatday.today
