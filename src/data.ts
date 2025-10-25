export interface Node {
  id: string;
  type: 'organization' | 'product' | 'software' | 'vulnerability';
  name: string;
  risk_score: number;
  exposure_level?: string;
  last_updated?: string;
}

export interface Edge {
  source: string;
  target: string;
  relation: 'uses' | 'depends_on' | 'affected_by' | 'supplies_to';
  confidence?: number;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export const graphData: GraphData = {
  nodes: [
    // Organizations
    { id: 'org_mtl', type: 'organization', name: 'City of Montreal', risk_score: 45 },
    { id: 'org_micrologic', type: 'organization', name: 'Micrologic', risk_score: 72 },
    { id: 'org_techcorp', type: 'organization', name: 'TechCorp Solutions', risk_score: 38 },
    { id: 'org_dataflow', type: 'organization', name: 'DataFlow Inc', risk_score: 55 },
    { id: 'org_cloudserve', type: 'organization', name: 'CloudServe', risk_score: 68 },
    
    // Products
    { id: 'product_veeam', type: 'product', name: 'Veeam Cloud Connect', risk_score: 65 },
    { id: 'product_openshift', type: 'product', name: 'OpenShift Platform', risk_score: 42 },
    { id: 'product_jenkins', type: 'product', name: 'Jenkins CI/CD', risk_score: 58 },
    { id: 'product_splunk', type: 'product', name: 'Splunk Enterprise', risk_score: 35 },
    { id: 'product_docker', type: 'product', name: 'Docker Enterprise', risk_score: 48 },
    { id: 'product_k8s', type: 'product', name: 'Kubernetes', risk_score: 52 },
    { id: 'product_postgres', type: 'product', name: 'PostgreSQL', risk_score: 30 },
    
    // Software Components
    { id: 'software_log4j', type: 'software', name: 'Log4j', risk_score: 85 },
    { id: 'software_nginx', type: 'software', name: 'nginx', risk_score: 40 },
    { id: 'software_openssl', type: 'software', name: 'OpenSSL', risk_score: 62 },
    { id: 'software_redis', type: 'software', name: 'Redis', risk_score: 45 },
    { id: 'software_spring', type: 'software', name: 'Spring Framework', risk_score: 55 },
    { id: 'software_jackson', type: 'software', name: 'Jackson', risk_score: 48 },
    { id: 'software_tomcat', type: 'software', name: 'Apache Tomcat', risk_score: 50 },
    
    // Vulnerabilities
    { id: 'vuln_cve2021_44228', type: 'vulnerability', name: 'CVE-2021-44228 (Log4Shell)', risk_score: 95 },
    { id: 'vuln_cve2024_1234', type: 'vulnerability', name: 'CVE-2024-1234', risk_score: 78 },
    { id: 'vuln_cve2024_5678', type: 'vulnerability', name: 'CVE-2024-5678', risk_score: 82 },
    { id: 'vuln_cve2025_9999', type: 'vulnerability', name: 'CVE-2025-9999', risk_score: 88 },
    { id: 'vuln_cve2024_3333', type: 'vulnerability', name: 'CVE-2024-3333', risk_score: 70 },
  ],
  edges: [
    // Organization -> Organization (supply chain)
    { source: 'org_mtl', target: 'org_micrologic', relation: 'supplies_to', confidence: 0.95 },
    { source: 'org_mtl', target: 'org_techcorp', relation: 'supplies_to', confidence: 0.88 },
    { source: 'org_micrologic', target: 'org_cloudserve', relation: 'supplies_to', confidence: 0.82 },
    { source: 'org_techcorp', target: 'org_dataflow', relation: 'supplies_to', confidence: 0.90 },
    
    // Organization -> Product
    { source: 'org_micrologic', target: 'product_veeam', relation: 'uses', confidence: 0.92 },
    { source: 'org_micrologic', target: 'product_jenkins', relation: 'uses', confidence: 0.87 },
    { source: 'org_techcorp', target: 'product_openshift', relation: 'uses', confidence: 0.90 },
    { source: 'org_techcorp', target: 'product_docker', relation: 'uses', confidence: 0.85 },
    { source: 'org_dataflow', target: 'product_splunk', relation: 'uses', confidence: 0.88 },
    { source: 'org_cloudserve', target: 'product_k8s', relation: 'uses', confidence: 0.93 },
    { source: 'org_cloudserve', target: 'product_postgres', relation: 'uses', confidence: 0.89 },
    
    // Product -> Software Component
    { source: 'product_veeam', target: 'software_log4j', relation: 'depends_on', confidence: 0.85 },
    { source: 'product_veeam', target: 'software_openssl', relation: 'depends_on', confidence: 0.90 },
    { source: 'product_jenkins', target: 'software_log4j', relation: 'depends_on', confidence: 0.88 },
    { source: 'product_openshift', target: 'software_nginx', relation: 'depends_on', confidence: 0.92 },
    { source: 'product_openshift', target: 'software_redis', relation: 'depends_on', confidence: 0.87 },
    { source: 'product_docker', target: 'software_openssl', relation: 'depends_on', confidence: 0.91 },
    { source: 'product_splunk', target: 'software_spring', relation: 'depends_on', confidence: 0.86 },
    { source: 'product_k8s', target: 'software_nginx', relation: 'depends_on', confidence: 0.89 },
    { source: 'product_postgres', target: 'software_openssl', relation: 'depends_on', confidence: 0.93 },
    { source: 'product_jenkins', target: 'software_tomcat', relation: 'depends_on', confidence: 0.84 },
    
    // Software -> Vulnerability
    { source: 'software_log4j', target: 'vuln_cve2021_44228', relation: 'affected_by', confidence: 1.0 },
    { source: 'software_openssl', target: 'vuln_cve2024_1234', relation: 'affected_by', confidence: 0.95 },
    { source: 'software_nginx', target: 'vuln_cve2024_5678', relation: 'affected_by', confidence: 0.92 },
    { source: 'software_spring', target: 'vuln_cve2025_9999', relation: 'affected_by', confidence: 0.97 },
    { source: 'software_tomcat', target: 'vuln_cve2024_3333', relation: 'affected_by', confidence: 0.89 },
  ]
};
