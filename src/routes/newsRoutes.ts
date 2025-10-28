import { Router } from 'express';
import { getNews, getTrendingNews, getArticleById } from '../controllers/newsController';

const router = Router();

router.get('/', getNews);
router.get('/trending', getTrendingNews);
router.get('/:id', getArticleById);

export default router;
