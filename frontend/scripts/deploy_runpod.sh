#!/bin/bash

# RunPod Pod Deployment Script
# Usage: ./deploy_runpod.sh [OPTIONS]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Default values
API_KEY="${RUNPOD_API_KEY:-}"
TEMPLATE_ID=""
POD_NAME=""
GPU_COUNT=1
VCPU_COUNT=16
COMPUTE_TYPE="GPU"
GLOBAL_NETWORKING=true
MIN_RAM_PER_GPU=48
MIN_VCPU_PER_GPU=16
GPU_TYPE_IDS=("NVIDIA L40S")
PORTS="8888/http,22/tcp"

# Function to convert comma-separated ports to JSON array
ports_to_json() {
    local ports_str="$1"
    local json="["
    local first=true
    
    IFS=',' read -ra PORT_ARRAY <<< "$ports_str"
    for port in "${PORT_ARRAY[@]}"; do
        if [[ "$first" == true ]]; then
            first=false
        else
            json+=","
        fi
        json+="\"$port\""
    done
    json+="]"
    echo "$json"
}

# Function to convert array to JSON array
array_to_json() {
    local arr=("$@")
    local json="["
    local first=true
    
    for item in "${arr[@]}"; do
        if [[ "$first" == true ]]; then
            first=false
        else
            json+=","
        fi
        json+="\"$item\""
    done
    json+="]"
    echo "$json"
}

# Function to display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Required:
    -k, --api-key KEY          RunPod API key (or set RUNPOD_API_KEY env var)
    -t, --template-id ID       Template ID
    -n, --name NAME            Pod name

Optional:
    -g, --gpu-count COUNT      Number of GPUs (default: 1)
    -v, --vcpu-count COUNT     Number of vCPUs (default: 16)
    -c, --compute-type TYPE    Compute type (default: GPU)
    --min-ram-per-gpu GB       Min RAM per GPU in GB (default: 48)
    --min-vcpu-per-gpu COUNT   Min vCPU per GPU (default: 16)
    --gpu-type-id TYPE         GPU type ID (can use multiple times, default: NVIDIA L40S)
    -p, --ports PORTS          Ports (default: 8888/http,22/tcp)
    --global-networking BOOL   Global networking (default: true)
    -h, --help                 Show help

Examples:
    $0 -k YOUR_API_KEY -t 43e4ftdqg8 -n "my-pod"
    $0 -k YOUR_API_KEY -t 43e4ftdqg8 -n "my-pod" -g 2 -v 32 --min-ram-per-gpu 80
    $0 -k YOUR_API_KEY -t 43e4ftdqg8 -n "my-pod" --gpu-type-id "NVIDIA A100"
    $0 -k YOUR_API_KEY -t 43e4ftdqg8 -n "my-pod" -p "8080/http,22/tcp,6006/http"

infinite_talk:
  $0 -k YOUR_API_KEY -t 43e4ftdqg8 -n "infinite_talk" \
  -g 1 \
  --min-ram-per-gpu 48 \
  --min-vcpu-per-gpu 16 \
  --gpu-type-id "NVIDIA L40S"

zonos:
  $0 -k YOUR_API_KEY -t m7q535817z -n "zonos" \
  -g 1 \
  --min-ram-per-gpu 8 \
  --min-vcpu-per-gpu 16 \
  --gpu-type-id "NVIDIA RTX 2000 Ada Generation"
    
EOF
    exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -k|--api-key)
            API_KEY="$2"
            shift 2
            ;;
        -t|--template-id)
            TEMPLATE_ID="$2"
            shift 2
            ;;
        -n|--name)
            POD_NAME="$2"
            shift 2
            ;;
        -g|--gpu-count)
            GPU_COUNT="$2"
            shift 2
            ;;
        -v|--vcpu-count)
            VCPU_COUNT="$2"
            shift 2
            ;;
        -c|--compute-type)
            COMPUTE_TYPE="$2"
            shift 2
            ;;
        --min-ram-per-gpu)
            MIN_RAM_PER_GPU="$2"
            shift 2
            ;;
        --min-vcpu-per-gpu)
            MIN_VCPU_PER_GPU="$2"
            shift 2
            ;;
        --gpu-type-id)
            GPU_TYPE_IDS=("$2")
            shift 2
            ;;
        -p|--ports)
            PORTS="$2"
            shift 2
            ;;
        --global-networking)
            GLOBAL_NETWORKING="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            ;;
    esac
done

# Validate required parameters
if [[ -z "$API_KEY" ]]; then
    echo -e "${RED}Error: API key is required${NC}"
    usage
fi

if [[ -z "$TEMPLATE_ID" ]]; then
    echo -e "${RED}Error: Template ID is required${NC}"
    usage
fi

if [[ -z "$POD_NAME" ]]; then
    echo -e "${RED}Error: Pod name is required${NC}"
    usage
fi

# Convert ports to JSON array
PORTS_JSON=$(ports_to_json "$PORTS")

# Convert GPU type IDs to JSON array
GPU_TYPE_IDS_JSON=$(array_to_json "${GPU_TYPE_IDS[@]}")

# Build JSON payload
JSON_PAYLOAD=$(cat <<EOF
{
  "name": "$POD_NAME",
  "templateId": "$TEMPLATE_ID",
  "gpuCount": $GPU_COUNT,
  "vcpuCount": $VCPU_COUNT,
  "computeType": "$COMPUTE_TYPE",
  "globalNetworking": $GLOBAL_NETWORKING,
  "ports": $PORTS_JSON,
  "minRAMPerGPU": $MIN_RAM_PER_GPU,
  "minVCPUPerGPU": $MIN_VCPU_PER_GPU,
  "gpuTypeIds": $GPU_TYPE_IDS_JSON
}
EOF
)

echo -e "${YELLOW}Deploying RunPod pod...${NC}"
echo "Pod Name: $POD_NAME"
echo "Template ID: $TEMPLATE_ID"
echo "GPU Count: $GPU_COUNT"
echo "vCPU Count: $VCPU_COUNT"
echo "Min RAM per GPU: ${MIN_RAM_PER_GPU}GB"
echo "Min vCPU per GPU: $MIN_VCPU_PER_GPU"
echo "GPU Types: ${GPU_TYPE_IDS[*]}"
echo "Ports: $PORTS"
echo ""

# Make API request
RESPONSE=$(curl -s -X POST "https://rest.runpod.io/v1/pods" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d "$JSON_PAYLOAD")

# Check if successful
if echo "$RESPONSE" | grep -q '"id"'; then
    echo -e "${GREEN}✓ Pod deployed successfully!${NC}"
    echo ""
    
    # Extract pod ID
    POD_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Pod ID: $POD_ID"
    echo ""
    
    # Pretty print response
    echo "Full Response:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    
    echo ""
    echo -e "${GREEN}Manage at: https://www.runpod.io/console/pods${NC}"
else
    echo -e "${RED}✗ Deployment failed${NC}"
    echo ""
    echo "Error:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    exit 1
fi