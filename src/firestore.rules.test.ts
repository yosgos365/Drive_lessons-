/**
 * Firestore Rules Verification Matrix
 * Tests boundary conditions, authorization checks, and payload constraints.
 */

export interface RuleTestScenario {
  id: string;
  description: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  payload?: Record<string, unknown>;
  expectedResult: 'ALLOWED' | 'PERMISSION_DENIED';
}

export const securityTestScenarios: RuleTestScenario[] = [
  {
    id: 'SEC-01',
    description: 'Unauthenticated read of private user profile',
    collection: '/users/user_target',
    operation: 'get',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'SEC-02',
    description: 'User A attempting to write to User B profile',
    collection: '/users/user_victim',
    operation: 'create',
    payload: {
      id: 'user_victim',
      email: 'victim@example.com',
      displayName: 'Victim',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'SEC-03',
    description: 'Attempting to inject undeclared ghost field in user profile',
    collection: '/users/user_attacker',
    operation: 'create',
    payload: {
      id: 'user_attacker',
      email: 'attacker@example.com',
      displayName: 'Attacker',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isAdminSuperUser: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'SEC-04',
    description: 'Item ownership hijacking with mismatched userId in payload',
    collection: '/users/user_attacker/items/item1',
    operation: 'create',
    payload: {
      id: 'item1',
      userId: 'user_victim',
      title: 'Hacked',
      type: 'note',
      content: 'test',
      category: 'work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'SEC-05',
    description: 'Title string length exceeding limit (>150 characters)',
    collection: '/users/user_legit/items/item1',
    operation: 'create',
    payload: {
      id: 'item1',
      userId: 'user_legit',
      title: 'A'.repeat(160),
      type: 'note',
      content: 'test',
      category: 'work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
