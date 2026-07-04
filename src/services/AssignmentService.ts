import { SPHttpClient } from '@microsoft/sp-http';

import { ASSETS_LIST_TITLE, ASSIGNMENTS_LIST_TITLE } from '../models/IListDefinitions';
import type { IAssignment } from '../models/IAsset';
import { resolveStatusAfterReturn } from '../utils/assignmentUtils';
import { SharePointRestService } from './SharePointRestService';

export interface IAssignAssetInput {
  assetId: number;
  assigneeUserId: number;
  notes?: string;
}

export interface IBookAssetInput {
  assetId: number;
  assigneeUserId: number;
  expectedReturnDate?: string;
  notes?: string;
}

export interface IReturnAssetInput {
  assetId: number;
  notes?: string;
}

export interface ICancelBookInput {
  assignmentId: number;
  notes?: string;
}

const ASSIGNMENT_SELECT =
  'Id,Title,AM_Action,AM_AssignmentDate,AM_ExpectedReturnDate,AM_ActualReturnDate,AM_Notes,AM_Asset/Id,AM_Asset/Title,AM_AssignedTo/Id,AM_AssignedTo/Title,AM_AssignedTo/Email';

/** Assignment transactions against AM_Assets and AM_Assignments. */
export class AssignmentService {
  private readonly rest: SharePointRestService;

  public constructor(spHttpClient: SPHttpClient, webUrl: string) {
    this.rest = new SharePointRestService(spHttpClient, webUrl);
  }

  public async assignAsset(input: IAssignAssetInput): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await this.rest.updateItem(ASSETS_LIST_TITLE, input.assetId, {
      AM_AssignedToId: input.assigneeUserId,
      AM_Status: 'Assigned',
      AM_AssignedDate: today
    });

    await this.rest.addListItem(ASSIGNMENTS_LIST_TITLE, {
      Title: `Assign — asset ${input.assetId}`,
      AM_AssetId: input.assetId,
      AM_Action: 'Assign',
      AM_AssignedToId: input.assigneeUserId,
      AM_AssignmentDate: today,
      AM_Notes: input.notes || ''
    });
  }

  public async bookAsset(input: IBookAssetInput): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await this.rest.addListItem(ASSIGNMENTS_LIST_TITLE, {
      Title: `Book — asset ${input.assetId}`,
      AM_AssetId: input.assetId,
      AM_Action: 'Book',
      AM_AssignedToId: input.assigneeUserId,
      AM_AssignmentDate: today,
      AM_ExpectedReturnDate: input.expectedReturnDate || '',
      AM_Notes: input.notes || ''
    });
  }

  public async returnAsset(input: IReturnAssetInput): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await this.rest.updateItem(ASSETS_LIST_TITLE, input.assetId, {
      AM_AssignedToId: null,
      AM_Status: resolveStatusAfterReturn(),
      AM_AssignedDate: null
    });

    await this.rest.addListItem(ASSIGNMENTS_LIST_TITLE, {
      Title: `Return — asset ${input.assetId}`,
      AM_AssetId: input.assetId,
      AM_Action: 'Return',
      AM_AssignmentDate: today,
      AM_ActualReturnDate: today,
      AM_Notes: input.notes || ''
    });
  }

  public async cancelBook(input: ICancelBookInput): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await this.rest.updateItem(ASSIGNMENTS_LIST_TITLE, input.assignmentId, {
      AM_Action: 'CancelBook',
      AM_ActualReturnDate: today,
      AM_Notes: input.notes || ''
    });
  }

  public async getAssignments(filter?: string): Promise<IAssignment[]> {
    return this.rest.getAllItems<IAssignment>(
      ASSIGNMENTS_LIST_TITLE,
      ASSIGNMENT_SELECT,
      'AM_Asset,AM_AssignedTo',
      filter,
      'AM_AssignmentDate desc'
    );
  }

  public async getOpenBookings(): Promise<IAssignment[]> {
    return this.getAssignments("AM_Action eq 'Book'");
  }
}
