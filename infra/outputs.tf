output "pages_subdomain" {
  value = "${cloudflare_pages_project.site.name}.pages.dev"
}

output "custom_domains" {
  value = [
    cloudflare_pages_domain.apex.name,
    cloudflare_pages_domain.www.name,
  ]
}
