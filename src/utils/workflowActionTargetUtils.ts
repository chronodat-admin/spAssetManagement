import { IPersonPickerItem } from '../models/IPersonPickerItem';

export const WORKFLOW_ROLE_TARGETS = [
  { value: 'owner', label: 'Asset assignee' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'creator', label: 'Asset creator' }
] as const;

export type WorkflowRoleTarget = (typeof WORKFLOW_ROLE_TARGETS)[number]['value'];

const PERSON_TARGET_PATTERN = /^(user|group):([^|]+)\|(.+)$/;

export function usesPeoplePickerAction(actionType: string): boolean {
  return actionType === 'notify' || actionType === 'assign';
}

export function serializePersonTarget(person: IPersonPickerItem): string {
  const loginName = person.loginName?.trim() || String(person.id);
  const kind = person.isGroup ? 'group' : 'user';
  return `${kind}:${loginName}|${person.title.trim()}`;
}

export function parsePersonTarget(target: string): IPersonPickerItem | undefined {
  const match = PERSON_TARGET_PATTERN.exec(target.trim());
  if (!match) {
    return undefined;
  }

  return {
    id: 0,
    loginName: match[2],
    title: match[3],
    isGroup: match[1] === 'group'
  };
}

export function formatWorkflowActionTarget(actionType: string, target: string): string {
  const person = parsePersonTarget(target);
  if (person) {
    return person.isGroup ? `${person.title} (Group)` : person.title;
  }

  const role = WORKFLOW_ROLE_TARGETS.find((item) => item.value === target);
  if (role) {
    return role.label;
  }

  if (actionType === 'set_field') {
    return `Field: ${target}`;
  }

  return target;
}

export function formatWorkflowActionLabel(actionType: string): string {
  switch (actionType) {
    case 'notify':
      return 'Send notification';
    case 'assign':
      return 'Assign to';
    case 'set_field':
      return 'Set field';
    case 'escalate':
      return 'Escalate';
    default:
      return actionType.replace(/_/g, ' ');
  }
}
