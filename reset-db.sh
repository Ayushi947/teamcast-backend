#!/bin/bash

echo "WARNING: This script will reset the entire database!"
echo "This will delete all data in the database specified by DATABASE_URL in your .env file."
echo "This action cannot be undone."
echo ""

# Extract and display the database URL (with password masked if present)
DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2-)
if [ -z "$DB_URL" ]; then
  echo "Error: DATABASE_URL not found in .env file."
  exit 1
fi

# Display masked DB URL for confirmation
MASKED_URL=$(echo $DB_URL | sed -E 's/\/\/([^:]+):([^@]+)@/\/\/\1:****@/')
echo "Database URL: $MASKED_URL"
echo ""

read -p "Are you sure you want to continue? (y/N): " confirmation
if [[ $confirmation != "y" && $confirmation != "Y" ]]; then
  echo "Operation cancelled."
  exit 0
fi

echo "Proceeding with database reset..."

rm -rf prisma/schema/migrations/*
npx prisma migrate reset
npx prisma migrate dev --name initial
npm run seed:dev
npm run generate
