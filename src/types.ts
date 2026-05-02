export enum TransportAgency {
  MENOUA = 'Menoua Voyages',
  REAL = 'Real Express',
  FINEXS = 'Finexs Voyages',
  INTERURBAIN = 'Interurbain',
  AUTRE = 'Autre'
}

export enum ServiceType {
  COLIS = 'Colis',
  GAZ = 'Gaz',
  REPAS = 'Repas',
  ADMINISTRATIF = 'Administratif',
  AUTRE = 'Autre'
}

export enum DeliveryStatus {
  PENDING = 'En attente',
  COLLECTED = 'Récupéré',
  IN_PROGRESS = 'En cours',
  DELIVERED = 'Livré'
}

export interface StatusEntry {
  status: DeliveryStatus;
  timestamp: string;
}

export interface Courier {
  id: string;
  name: string;
  phone: string;
  photoUrl: string;
  badgeId: string;
}

export interface Delivery {
  id: string;
  displayId: string;
  timestamp: string;
  clientName: string;
  whatsappNumber: string;
  transportAgency: TransportAgency;
  receiptPhoto?: string;
  deliveryQuarter: string;
  serviceType: ServiceType;
  parcelStatusPhoto?: string;
  securityCode: string; // 4-digit code
  clientSignature?: string;
  status: DeliveryStatus;
  statusHistory: StatusEntry[];
  totalAmount: number;
  notes?: string;
  createdBy: string;
  createdAt?: any;
  updatedAt?: any;
  courierId?: string;
  courierName?: string;
  courierPhone?: string;
  courierBadgeId?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
