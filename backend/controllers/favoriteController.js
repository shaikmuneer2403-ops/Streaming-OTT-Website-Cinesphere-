import FavoriteModel from '../models/Favorite.js';

export async function getUserFavorites(req, res, next) {
  try {
    const favorites = await FavoriteModel.findByUser(req.user._id);
    return res.json({
      success: true,
      count: favorites.length,
      favorites
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleFavorite(req, res, next) {
  try {
    const { contentId, contentType } = req.body;

    if (!contentId) {
      return res.status(400).json({
        success: false,
        message: 'contentId is required.'
      });
    }

    const result = await FavoriteModel.toggle({
      userId: req.user._id,
      contentId,
      contentType: contentType || 'movie'
    });

    return res.json({
      success: true,
      action: result.action,
      message: result.action === 'added' ? 'Added to My List!' : 'Removed from My List.'
    });
  } catch (err) {
    next(err);
  }
}

export async function removeFavorite(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await FavoriteModel.deleteItem(id, req.user._id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in favorites.'
      });
    }

    return res.json({
      success: true,
      message: 'Removed from My List.'
    });
  } catch (err) {
    next(err);
  }
}
