# Workload Identity Setup for Teamcast Backend

This guide explains how to migrate from using `GOOGLE_APPLICATION_CREDENTIALS` service account key files to Workload Identity in Google Kubernetes Engine (GKE) for enhanced security.

## Overview

Workload Identity allows Kubernetes Service Accounts to act as Google Service Accounts without storing service account keys in your cluster. This is more secure and follows Google Cloud best practices.

## Prerequisites

1. GKE cluster with Workload Identity enabled
2. Google Cloud SDK (`gcloud`) installed and configured
3. `kubectl` configured to access your GKE cluster
4. Required IAM permissions in your Google Cloud project

## Step 1: Enable Workload Identity on Your GKE Cluster

If you haven't already enabled Workload Identity on your cluster:

```bash
# For existing cluster
gcloud container clusters update CLUSTER_NAME \
    --location=LOCATION \
    --workload-pool=PROJECT_ID.svc.id.goog

# For new cluster
gcloud container clusters create CLUSTER_NAME \
    --location=LOCATION \
    --workload-pool=PROJECT_ID.svc.id.goog
```

Replace:

- `CLUSTER_NAME` with your cluster name
- `LOCATION` with your cluster location (e.g., `us-central1`)
- `PROJECT_ID` with your Google Cloud project ID (`teamcastai`)

## Step 2: Create Google Service Account

Create a Google Service Account with the necessary permissions:

```bash
# Create the service account
gcloud iam service-accounts create teamcast-backend \
    --display-name="Teamcast Backend Service Account" \
    --description="Service account for Teamcast backend workloads"

# Grant necessary IAM roles
gcloud projects add-iam-policy-binding teamcastai \
    --member="serviceAccount:teamcast-backend@teamcastai.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding teamcastai \
    --member="serviceAccount:teamcast-backend@teamcastai.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding teamcastai \
    --member="serviceAccount:teamcast-backend@teamcastai.iam.gserviceaccount.com" \
    --role="roles/speech.editor"

gcloud projects add-iam-policy-binding teamcastai \
    --member="serviceAccount:teamcast-backend@teamcastai.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"

# Add any other roles your application needs
```

## Step 3: Create Kubernetes Resources

Apply the Kubernetes manifests in order:

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create service account with workload identity annotation
kubectl apply -f k8s/service-account.yaml

# Create ConfigMap
kubectl apply -f k8s/configmap.yaml

# Create secrets (fill in actual values first!)
cp k8s/secret-template.yaml k8s/secret.yaml
# Edit k8s/secret.yaml with your actual secret values
kubectl apply -f k8s/secret.yaml

# Create service
kubectl apply -f k8s/service.yaml

# Create deployment
kubectl apply -f k8s/deployment.yaml
```

## Step 4: Configure IAM Policy Binding

Allow the Kubernetes Service Account to impersonate the Google Service Account:

```bash
gcloud iam service-accounts add-iam-policy-binding \
    teamcast-backend@teamcastai.iam.gserviceaccount.com \
    --role roles/iam.workloadIdentityUser \
    --member "serviceAccount:teamcastai.svc.id.goog[teamcast/teamcast-backend]"
```

## Step 5: Update Your Application Configuration

The application code has been updated to automatically detect and use Workload Identity. The new authentication flow is:

1. **Workload Identity** (GKE) - Automatic, no credentials needed
2. **Service Account Environment Variables** - Fallback for other environments
3. **Service Account Key File** - Legacy fallback

### Environment Variables

With Workload Identity, you only need to set:

```yaml
env:
  - name: GOOGLE_CLOUD_PROJECT_ID
    value: 'teamcastai'
# No GOOGLE_APPLICATION_CREDENTIALS needed!
# No GOOGLE_CLOUD_CLIENT_EMAIL needed!
# No GOOGLE_CLOUD_PRIVATE_KEY needed!
```

## Step 6: Verify the Setup

1. Check that the pods are running:

```bash
kubectl get pods -n teamcast
```

2. Check the logs for authentication method:

```bash
kubectl logs -n teamcast deployment/teamcast-backend
```

You should see logs indicating "Using Google Cloud Workload Identity authentication".

3. Test Google Cloud service access:

```bash
kubectl exec -n teamcast deployment/teamcast-backend -- \
  gcloud auth list
```

## Security Benefits

### Before (Service Account Keys)

- ❌ Service account keys stored in Kubernetes secrets
- ❌ Keys don't rotate automatically
- ❌ Risk of key exposure if secrets are compromised
- ❌ Difficult to audit key usage

### After (Workload Identity)

- ✅ No service account keys in cluster
- ✅ Automatic credential management
- ✅ Fine-grained IAM controls
- ✅ Better audit trails
- ✅ Follows Google Cloud security best practices

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**

   - Verify IAM roles are assigned to the Google Service Account
   - Check the workload identity binding

2. **"Workload Identity authentication failed"**

   - Ensure Workload Identity is enabled on the cluster
   - Verify the service account annotation is correct

3. **"Application Default Credentials not found"**
   - Check that the pod is using the correct Kubernetes Service Account
   - Verify the workload identity binding

### Debug Commands

```bash
# Check workload identity binding
gcloud iam service-accounts get-iam-policy \
    teamcast-backend@teamcastai.iam.gserviceaccount.com

# Check cluster workload identity configuration
gcloud container clusters describe CLUSTER_NAME \
    --location=LOCATION \
    --format="value(workloadIdentityConfig.workloadPool)"

# Check pod service account
kubectl get pod POD_NAME -n teamcast -o yaml | grep serviceAccount

# Test authentication from within pod
kubectl exec -n teamcast POD_NAME -- \
  curl -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token
```

## Migration Steps from Service Account Keys

1. **Backup**: Keep your current deployment working while testing
2. **Deploy**: Apply the new Kubernetes manifests to a test environment
3. **Test**: Verify all Google Cloud services work correctly
4. **Switch**: Update production deployment
5. **Cleanup**: Remove service account keys and related secrets

## Additional Security Considerations

1. **Principle of Least Privilege**: Only grant necessary IAM roles
2. **Regular Audits**: Monitor IAM bindings and access patterns
3. **Network Policies**: Restrict pod-to-pod communication
4. **Pod Security**: Use security contexts and admission controllers

## Monitoring

Monitor workload identity usage through:

- Cloud Audit Logs
- Cloud Monitoring metrics
- GKE cluster logs

```bash
# View audit logs for service account usage
gcloud logging read "protoPayload.authenticationInfo.principalEmail=teamcast-backend@teamcastai.iam.gserviceaccount.com"
```

## References

- [GKE Workload Identity Documentation](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)
- [Google Cloud IAM Best Practices](https://cloud.google.com/iam/docs/using-iam-securely)
- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/)
