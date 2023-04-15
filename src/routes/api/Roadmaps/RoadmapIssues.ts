import { Router } from 'express';
import Paths from '@src/routes/constants/Paths';
import {
  RequestWithSession,
  requireSessionMiddleware,
} from '@src/middleware/session';
import { IIssue, Issue } from '@src/models/Issue';
import HttpStatusCodes from '@src/constants/HttpStatusCodes';
import Database from '@src/util/DatabaseDriver';
import { Roadmap } from '@src/models/Roadmap';

const RoadmapIssues = Router({ mergeParams: true });

RoadmapIssues.post(Paths.Roadmaps.Issues.Create, requireSessionMiddleware);
RoadmapIssues.post(Paths.Roadmaps.Issues.Create,
  async (req: RequestWithSession, res) => {
    //get data from body and session
    let issue;
    const session = req.session;

    try {
      // eslint-disable-next-line max-len
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
      const issueData = JSON.parse(req.body?.issue) as IIssue;

      if (!issueData) {
        throw new Error('Issue is missing.');
      }

      // set userId
      issueData.userId = session?.userId || BigInt(-1);
      issueData.id = BigInt(-1);

      // update createdAt and updatedAt
      issueData.createdAt = new Date(issueData.createdAt);
      issueData.updatedAt = new Date(issueData.updatedAt);

      issue = Issue.from(issueData);
    } catch (e) {
      return res.status(HttpStatusCodes.BAD_REQUEST)
        .json({ error: 'Issue data is invalid.' });
    }

    // get database connection
    const db = new Database();

    // save issue to database
    const id = await db.insert('issues', issue);

    // check if id is valid
    if (id < 0) return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: 'Issue could not be saved to database.' });

    // return id
    return res.status(HttpStatusCodes.CREATED).json({ id: id.toString() });
  });

// Delete Issue
RoadmapIssues.delete(Paths.Roadmaps.Issues.Delete, requireSessionMiddleware);
RoadmapIssues.delete(Paths.Roadmaps.Issues.Delete,
  async (req: RequestWithSession, res) => {
    // get data from body and session
    const session = req.session;
    const id = BigInt(req.params.issueId);

    // get database connection
    const db = new Database();

    // get issue from the database
    const issue = await db.get<Issue>('issues', id);

    // check if issue exists
    if (!issue) return res.status(HttpStatusCodes.NOT_FOUND)
      .json({ error: 'Issue not found.' });

    const roadmap = await db.get<Roadmap>('roadmaps', issue.roadmapId);

    // check if roadmap exists
    if (!roadmap) return res.status(HttpStatusCodes.NOT_FOUND)
      .json({ error: 'Roadmap not found.' });

    // check if user is owner
    if (issue.userId !== session?.userId && roadmap.ownerId !== session?.userId)
      return res.status(HttpStatusCodes.FORBIDDEN)
        .json({ error: 'User is not owner of issue or roadmap.' });

    // delete issue from database
    const success = await db.delete('issues', id);

    // check if issue was deleted
    if (!success) return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: 'Issue could not be deleted.' });

    // return success
    return res.status(HttpStatusCodes.OK).json({ success: true });
  });

export default RoadmapIssues;