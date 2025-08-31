import 'server-only';
import { TaskDocument, getCollection } from '@/lib/database';

export async function getTimelineElements() {
  const collection = await getCollection<TaskDocument>('timeline');
  const elements = await collection
    .find({})
    .sort({ 'elementData.timeFrame.start': 1 })
    .toArray();

  return elements;
};