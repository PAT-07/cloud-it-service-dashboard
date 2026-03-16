#!/bin/bash
# ci-cd/deploy-lambda.sh
# --------------------------------------------------
# Manual deployment helper script.
# Run from project root: bash ci-cd/deploy-lambda.sh
# --------------------------------------------------
set -e  # exit on any error

# ── Config — edit these or export as env vars ────
FUNCTION_NAME="${LAMBDA_FUNCTION_NAME:-cloud-it-service-api}"
REGION="${AWS_REGION:-us-east-1}"
RUNTIME="python3.11"
HANDLER="main.handler"
MEMORY_MB=512
TIMEOUT_SEC=30
ROLE_ARN="${LAMBDA_ROLE_ARN}"   # e.g. arn:aws:iam::123456789012:role/lambda-execution-role

DIR="backend/lambda-api"
PACKAGE_DIR="${DIR}/package"
ZIP_FILE="${DIR}/lambda_deployment.zip"

echo "=== Cloud IT Service Dashboard — Lambda Deployment ==="
echo "Function : ${FUNCTION_NAME}"
echo "Region   : ${REGION}"

# ── Step 1: Install dependencies ────────────────
echo ""
echo "📦 Installing dependencies…"
pip install -r "${DIR}/requirements.txt" \
  --target "${PACKAGE_DIR}" \
  --platform manylinux2014_x86_64 \
  --implementation cp \
  --python-version 3.11 \
  --only-binary=:all: \
  --quiet

# ── Step 2: Copy source files ────────────────────
echo "📁 Copying source files…"
for f in config.py database.py main.py schemas.py; do
  cp "${DIR}/${f}" "${PACKAGE_DIR}/"
done
cp -r "${DIR}/models"     "${PACKAGE_DIR}/"
cp -r "${DIR}/routes"     "${PACKAGE_DIR}/"
cp -r "${DIR}/middleware"  "${PACKAGE_DIR}/"
cp -r "${DIR}/utils"       "${PACKAGE_DIR}/"

# ── Step 3: Zip ──────────────────────────────────
echo "🗜  Creating deployment ZIP…"
rm -f "${ZIP_FILE}"
cd "${PACKAGE_DIR}"
zip -r "../lambda_deployment.zip" . \
  --exclude "*.pyc" \
  --exclude "__pycache__/*" \
  --exclude "*.dist-info/*" \
  --quiet
cd - > /dev/null
echo "Package size: $(du -sh "${ZIP_FILE}" | cut -f1)"

# ── Step 4: Deploy or create Lambda ─────────────
echo ""
if aws lambda get-function --function-name "${FUNCTION_NAME}" --region "${REGION}" > /dev/null 2>&1; then
  echo "🔄 Updating existing Lambda function…"
  aws lambda update-function-code \
    --function-name "${FUNCTION_NAME}" \
    --zip-file "fileb://${ZIP_FILE}" \
    --region "${REGION}"

  # Wait for update
  aws lambda wait function-updated \
    --function-name "${FUNCTION_NAME}" \
    --region "${REGION}"

  # Update config (memory/timeout)
  aws lambda update-function-configuration \
    --function-name "${FUNCTION_NAME}" \
    --memory-size "${MEMORY_MB}" \
    --timeout "${TIMEOUT_SEC}" \
    --region "${REGION}"

else
  echo "🆕 Creating new Lambda function…"
  aws lambda create-function \
    --function-name "${FUNCTION_NAME}" \
    --runtime "${RUNTIME}" \
    --handler "${HANDLER}" \
    --zip-file "fileb://${ZIP_FILE}" \
    --role "${ROLE_ARN}" \
    --memory-size "${MEMORY_MB}" \
    --timeout "${TIMEOUT_SEC}" \
    --environment "Variables={APP_ENV=production}" \
    --region "${REGION}"
fi

echo ""
echo "✅ Lambda deployment complete!"
echo "   Invoke URL will be available via API Gateway after route configuration."
