import WatchHistoryModel from '../models/WatchHistory.js';

export async function getUserHistory(req, res, next) {
  try {
    const history = await WatchHistoryModel.findByUser(req.user._id);
    return res.json({
      success: true,
      count: history.length,
      history
    });
  } catch (err) {
    next(err);
  }
}

export async function saveProgress(req, res, next) {
  try {
    const { contentId, contentType, episode, progress, duration } = req.body;

    if (!contentId || progress === undefined || duration === undefined) {
      return res.status(400).json({
        success: false,
        message: 'contentId, progress, and duration are required.'
      });
    }

    const saved = await WatchHistoryModel.upsert({
      userId: req.user._id,
      contentId,
      contentType: contentType || 'movie',
      episode: episode || null,
      progress: Number(progress),
      duration: Number(duration)
    });

    return res.json({
      success: true,
      message: 'Watch progress saved.',
      record: saved
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteHistoryItem(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await WatchHistoryModel.deleteItem(id, req.user._id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'History item not found.'
      });
    }

    return res.json({
      success: true,
      message: 'Item removed from watch history.'
    });
  } catch (err) {
    next(err);
  }
}

export async function clearHistory(req, res, next) {
  try {
    await WatchHistoryModel.clearUser(req.user._id);
    return res.json({
      success: true,
      message: 'Watch history successfully cleared.'
    });
  } catch (err) {
    next(err);
  }
}
