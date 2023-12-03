'use server';

import { FilterQuery } from 'mongoose';
import Tag, { ITag } from '@/db/models/tag.model';
import User from '@/db/models/user.model';
import Question from '@/db/models/question.model';
import {
  GetAllTagsParams,
  GetQuestionsByTagIdParams,
  GetTopInteractedTagsParams,
} from '@/types/action';

export const getAllTags = async (params: GetAllTagsParams) => {
  try {
    const { searchQuery, filter } = params;
    const query: FilterQuery<typeof Tag> = {};
    if (searchQuery) {
      query.$or = [{ name: { $regex: new RegExp(searchQuery, 'i') } }];
    }

    let sortOptions = {};
    switch (filter) {
      case 'popular':
        sortOptions = { questions: -1 };
        break;
      case 'recent':
        sortOptions = { createdAt: -1 };
        break;
      case 'old':
        sortOptions = { createdAt: 1 };
        break;
      case 'name':
        sortOptions = { name: 1 };
        break;
      default:
        break;
    }

    const tags = await Tag.find(query).sort(sortOptions);
    return tags;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getTopInteractedTags = async (params: GetTopInteractedTagsParams) => {
  try {
    const { userId, limit = 3 } = params;
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    return [
      { id: '1', name: 'Tag 1' },
      { id: '2', name: 'Tag 2' },
      { id: '3', name: 'Tag 3' },
    ];
  } catch (error) {
    console.log(error);
  }
};

export const getQuestionsByTagId = async (params: GetQuestionsByTagIdParams) => {
  try {
    const { tagId, page = 1, pageSize = 10, searchQuery } = params;
    const tagFilter: FilterQuery<ITag> = { _id: tagId };
    const tag = await Tag.findOne(tagFilter).populate({
      path: 'questions',
      model: Question,
      match: searchQuery ? { title: { $regex: searchQuery, $options: 'i' } } : {},
      options: {
        sort: { createdAt: -1 },
      },
      populate: [
        { path: 'tags', model: Tag, select: '_id name' },
        { path: 'author', model: User, select: '_id clerkId name username picture' },
      ],
    });
    if (!tag) throw new Error('Tag not found');
    const questions = tag.questions;
    return { tagName: tag.name, questions };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getPopularTags = async () => {
  try {
    const popularTags = await Tag.aggregate([
      { $project: { name: 1, numberOfQuestions: { $size: '$questions' } } },
      { $sort: { numberOfQuestions: -1 } },
      { $limit: 5 },
    ]);
    return popularTags;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
