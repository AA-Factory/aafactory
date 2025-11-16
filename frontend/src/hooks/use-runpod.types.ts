export interface RunpodTemplate {
  id: string;
  name: string;
  imageName?: string;
  dockerArgs?: string;
  env?: Array<{ key: string; value: string }>;
}

export interface RunpodPod {
  id: string;
  name: string;
  costPerHr?: number;
  containerDiskInGb?: number;
  vcpuCount?: number;
  imageName?: string;
  machine?: {
    gpuTypeId?: string;
  };
  desiredStatus: string;
  runtime?: {
    gpus?: Array<{
      publicIp?: string;
      id: string;
      gpuType: string;
    }>;
    ports?: Array<{
      privatePort: number;
      publicPort: number;
      type: string;
    }>;
  };
  machineId?: string;
  templateId?: string;
  publicIp?: string;
  portMappings?: Record<string, number>;
  env?: Record<string, string>;
}

export interface DeployPodParams {
  templateId: string;
  podName: string;
  gpuCount?: number;
  vcpuCount?: number;
  computeType?: string;
  globalNetworking?: boolean;
  minRAMPerGPU?: number;
  minVCPUPerGPU?: number;
  gpuTypeIds?: string[];
  ports?: string[];
  redisEndpoint?: string;
}
