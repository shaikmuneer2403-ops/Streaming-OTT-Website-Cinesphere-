import SeriesModel from '../models/Series.js';

export async function getAllSeries(req, res, next) {
  try {
    const series = await SeriesModel.find();
    return res.json({
      success: true,
      count: series.length,
      series
    });
  } catch (err) {
    next(err);
  }
}

export async function getSeriesById(req, res, next) {
  try {
    const { id } = req.params;
    const item = await SeriesModel.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Series not found.'
      });
    }

    return res.json({
      success: true,
      series: item
    });
  } catch (err) {
    next(err);
  }
}

export async function createSeries(req, res, next) {
  try {
    const { title, description, poster, backdrop, genres, releaseYear, rating, seasons, featured } = req.body;

    if (!title || !description || !poster) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and poster are required.'
      });
    }

    const created = await SeriesModel.create({
      title,
      description,
      poster,
      backdrop: backdrop || poster,
      genres: genres || ['Drama'],
      releaseYear: releaseYear || new Date().getFullYear(),
      rating: rating || 8.0,
      seasons: seasons || [],
      featured: Boolean(featured)
    });

    return res.status(201).json({
      success: true,
      message: 'Series created successfully!',
      series: created
    });
  } catch (err) {
    next(err);
  }
}

export async function updateSeries(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await SeriesModel.updateById(id, req.body);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Series not found.'
      });
    }

    return res.json({
      success: true,
      message: 'Series updated successfully!',
      series: updated
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteSeries(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await SeriesModel.deleteById(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Series not found.'
      });
    }

    return res.json({
      success: true,
      message: 'Series deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}
