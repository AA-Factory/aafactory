// RunPod template configuration
export interface TemplateConfig {
  gpuTypeIds: string[];
  vCPUOptions: number[];
  defaultGpuTypeId?: string;
  defaultVCPU?: number;
}

// Template configurations keyed by template ID
// Each template can have different GPU types and vCPU options
export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  // Example configurations - replace with your actual template IDs and options:

  //InfiniteTalk Template
  '43e4ftdqg8': {
    gpuTypeIds: ['NVIDIA L40S', 'NVIDIA GeForce RTX 5090'],
    vCPUOptions: [24, 32, 48],
    defaultGpuTypeId: 'NVIDIA L40S',
    defaultVCPU: 24,
  },

  //qwen image template
  'hhqwb5m61n': {
    gpuTypeIds: ['NVIDIA GeForce RTX 3090', 'NVIDIA GeForce RTX 5090'],
    vCPUOptions: [2, 4, 6],
    defaultGpuTypeId: 'NVIDIA GeForce RTX 3090',
    defaultVCPU: 4,
  },

  //wan-anmi template
  'fu616kdwju': {
    gpuTypeIds: ['NVIDIA RTX A6000'],
    vCPUOptions: [4, 6],
    defaultGpuTypeId: 'NVIDIA RTX A6000',
    defaultVCPU: 4,
  },
  //zonos template
  'm7q535817z': {
    gpuTypeIds: ['NVIDIA RTX A4000'],
    vCPUOptions: [4, 6],
    defaultGpuTypeId: 'NVIDIA RTX A4000',
    defaultVCPU: 4,
  },

  // Add more template configurations as needed
};

// Default configuration for templates without specific config
export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  gpuTypeIds: [
    'NVIDIA GeForce RTX 3090',
    'NVIDIA RTX A4500',
    'NVIDIA RTX A6000',
    'NVIDIA L40S',
    'NVIDIA L4',
    'NVIDIA H100 80GB HBM3',
    'NVIDIA RTX 4000 Ada Generation',
    'NVIDIA A100 80GB PCIe',
    'NVIDIA A100-SXM4-80GB',
    'NVIDIA RTX A4000',
    'NVIDIA RTX 6000 Ada Generation',
    'NVIDIA RTX 2000 Ada Generation',
    'NVIDIA H200',
    'NVIDIA L40',
    'NVIDIA H100 NVL',
    'NVIDIA H100 PCIe',
    'NVIDIA GeForce RTX 3080 Ti',
    'NVIDIA GeForce RTX 3080',
    'NVIDIA GeForce RTX 3070',
    'Tesla V100-PCIE-16GB',
    'AMD Instinct MI300X OAM',
    'NVIDIA RTX A2000',
    'Tesla V100-FHHL-16GB',
    'NVIDIA GeForce RTX 4080 SUPER',
    'Tesla V100-SXM2-16GB',
    'NVIDIA GeForce RTX 4070 Ti',
    'Tesla V100-SXM2-32GB',
    'NVIDIA RTX 4000 SFF Ada Generation',
    'NVIDIA RTX 5000 Ada Generation',
    'NVIDIA GeForce RTX 5090',
    'NVIDIA A30',
    'NVIDIA GeForce RTX 4080',
    'NVIDIA GeForce RTX 5080',
    'NVIDIA GeForce RTX 3090 Ti',
    'NVIDIA B200',
  ],
  vCPUOptions: [2, 4, 6, 8, 12, 16, 24, 32, 48],
  defaultGpuTypeId: 'NVIDIA GeForce RTX 3090',
  defaultVCPU: 8,
};

// Helper function to get config for a template
export function getTemplateConfig(templateId: string): TemplateConfig {
  return TEMPLATE_CONFIGS[templateId] || DEFAULT_TEMPLATE_CONFIG;
}
