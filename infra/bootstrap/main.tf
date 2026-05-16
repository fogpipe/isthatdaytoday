terraform {
  required_version = ">= 1.11"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

provider "cloudflare" {}

variable "account_id" {
  type = string
}

resource "cloudflare_r2_bucket" "tfstate" {
  account_id = var.account_id
  name       = "isthatdaytoday-tfstate"
  location   = "WEUR"
}

output "bucket_name" {
  value = cloudflare_r2_bucket.tfstate.name
}
