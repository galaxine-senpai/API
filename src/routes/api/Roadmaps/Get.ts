import { Router } from 'express';
import Paths from '@src/routes/constants/Paths';
import { RequestWithSession } from '@src/middleware/session';
import HttpStatusCodes from '@src/constants/HttpStatusCodes';
import Database from '@src/util/DatabaseDriver';
import { Roadmap } from '@src/models/Roadmap';
import axios from 'axios';
import EnvVars from '@src/constants/EnvVars';
import logger from 'jet-logger';

const GetRouter = Router({ mergeParams: true });

type Tag = {
  id: bigint;
  roadmapId: bigint;
  name: string;
}

GetRouter.get(Paths.Roadmaps.Get.Roadmap,
  async (req: RequestWithSession, res) => {
    //get data from params
    const id = req.params.roadmapId;

    if (!id) return res.sendStatus(HttpStatusCodes.BAD_REQUEST)
      .json({ error: 'Roadmap id is missing.' });

    // get database connection
    const db = new Database();

    // get roadmap from database
    const roadmap = await db.get<Roadmap>('roadmaps', BigInt(id));
    const issueCount = await db.countWhere('issues', 'roadmapId', id);

    // check if roadmap is valid
    if (!roadmap) return res.sendStatus(HttpStatusCodes.NOT_FOUND)
      .json({ error: 'Roadmap does not exist.' });

    // return roadmap
    return res.status(HttpStatusCodes.OK).json({
      id: roadmap.id.toString(),
      name: roadmap.name,
      description: roadmap.description,
      ownerId: roadmap.ownerId.toString(),
      issueCount: issueCount.toString(),
      // TODO: star count
      // TODO: add progress info
      createdAt: roadmap.createdAt,
      updatedAt: roadmap.updatedAt,
      isPublic: roadmap.isPublic,
      data: roadmap.data,
    });
  });

GetRouter.get(Paths.Roadmaps.Get.MiniRoadmap,
  async (req: RequestWithSession, res) => {
    // get id from params
    const id = req.params.roadmapId;

    if (!id) return res.sendStatus(HttpStatusCodes.BAD_REQUEST)
      .json({ error: 'Roadmap id is missing.' });

    // get database connection
    const db = new Database();

    // get roadmap from database
    const roadmap = await db.get<Roadmap>('roadmaps', BigInt(id));
    const issueCount = await db.countWhere('issues', 'roadmapId', id);
    // TODO add star count

    // check if roadmap is valid
    if (!roadmap) return res.sendStatus(HttpStatusCodes.NOT_FOUND)
      .json({ error: 'Roadmap does not exist.' });

    // return roadmap
    return res.status(HttpStatusCodes.OK).json({
      id: roadmap.id.toString(),
      name: roadmap.name,
      description: roadmap.description,
      issueCount: issueCount.toString(),
      ownerId: roadmap.ownerId.toString(),
    });
  });

GetRouter.get(Paths.Roadmaps.Get.Tags,
  async (req: RequestWithSession, res) => {
    //get data from params
    const id = req.params.roadmapId;

    if (!id) return res.sendStatus(HttpStatusCodes.BAD_REQUEST)
      .json({ error: 'Roadmap id is missing.' });

    // get database connection
    const db = new Database();

    // check if roadmap exists
    const roadmap = await db.get<Roadmap>('roadmaps', BigInt(id));
    if (!roadmap) return res.sendStatus(HttpStatusCodes.NOT_FOUND).json({
      error: 'Roadmap does not exist.',
    });

    // get tags from database
    const tags = await db.getAllWhere<Tag>('roadmapTags', 'roadmapId', id);

    // check if there are any tags
    if (tags?.length === 0 || !tags) {
      // return empty array
      return res.sendStatus(HttpStatusCodes.OK).json({ tags: [] });
    }

    // map tags name to array
    const tagNames = tags.map(tag => tag.name);

    // return tags
    return res.status(HttpStatusCodes.OK).json({ tags: tagNames });
  });

GetRouter.get(Paths.Roadmaps.Get.Owner,
  async (req: RequestWithSession, res) => {
    //get data from params
    const id = req.params.roadmapId;

    if (!id) return res.sendStatus(HttpStatusCodes.BAD_REQUEST)
      .json({ error: 'Roadmap id is missing.' });

    // get database connection
    const db = new Database();

    // get roadmap from database
    const roadmap = await db.get<Roadmap>('roadmaps', BigInt(id));

    // check if roadmap is valid
    if (!roadmap) return res.sendStatus(HttpStatusCodes.NOT_FOUND)
      .json({ error: 'Roadmap does not exist.' });

    // fetch /api/users/:id
    axios.get(`http://localhost:${EnvVars.Port}/api/users/${roadmap.ownerId}`)
      .then(response => {
        res.status(response.status).json(response.data);
      })
      .catch(error => {
        logger.err(error);
        res.status(500).send('An error occurred');
      });
  });

GetRouter.get(Paths.Roadmaps.Get.OwnerMini,
  async (req: RequestWithSession, res) => {
    //get data from params
    const id = req.params.roadmapId;

    if (!id) return res.sendStatus(HttpStatusCodes.BAD_REQUEST)
      .json({ error: 'Roadmap id is missing.' });

    // get database connection
    const db = new Database();

    // get roadmap from database
    const roadmap = await db.get<Roadmap>('roadmaps', BigInt(id));

    // check if roadmap is valid
    if (!roadmap) return res.sendStatus(HttpStatusCodes.NOT_FOUND)
      .json({ error: 'Roadmap does not exist.' });

    // fetch /api/users/:id
    const user =
      await axios.get(
        `http://localhost:${EnvVars.Port}/api/users/${roadmap.ownerId}/mini`);

    // ? might need to check if json needs to be parsed

    // return roadmap
    return res.status(user.status).json(user.data);
  });

export default GetRouter;