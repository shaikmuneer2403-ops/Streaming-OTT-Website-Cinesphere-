import MovieModel from '../models/Movie.js';
import { sampleGenres } from '../utils/seedData.js';

export async function getAllMovies(req, res, next) {
  try {
    const { genre, search, year, sort, limit, featured } = req.query;
    const movies = await MovieModel.find({
      genre,
      search,
      year,
      sort,
      limit: limit ? parseInt(limit, 10) : 50,
      featured: featured !== undefined ? featured === 'true' : undefined
    });

    return res.json({
      success: true,
      count: movies.length,
      genres: sampleGenres,
      movies
    });
  } catch (err) {
    next(err);
  }
}

export async function getMovieById(req, res, next) {
  try {
    const { id } = req.params;
    const movie = await MovieModel.findById(id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found.'
      });
    }

    // Increment views asynchronously
    await MovieModel.incrementViews(id);

    return res.json({
      success: true,
      movie
    });
  } catch (err) {
    next(err);
  }
}

export async function createMovie(req, res, next) {
  try {
    const { title, description, poster, backdrop, videoUrl, trailerUrl, genres, cast, director, releaseYear, duration, rating, featured, ageRating, language } = req.body;

    if (!title || !description || !poster || !backdrop || !videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, poster, backdrop, and videoUrl are required.'
      });
    }

    const created = await MovieModel.create({
      title,
      description,
      poster,
      backdrop,
      videoUrl,
      trailerUrl,
      genres: genres || ['Action'],
      cast: cast || ['Lead Actor'],
      director: director || 'Director',
      releaseYear: releaseYear || new Date().getFullYear(),
      duration: duration || 120,
      rating: rating || 8.0,
      featured: Boolean(featured),
      ageRating: ageRating || 'PG-13',
      language: language || 'English'
    });

    return res.status(201).json({
      success: true,
      message: 'Movie added successfully!',
      movie: created
    });
  } catch (err) {
    next(err);
  }
}

export async function updateMovie(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await MovieModel.updateById(id, req.body);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found.'
      });
    }

    return res.json({
      success: true,
      message: 'Movie updated successfully!',
      movie: updated
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteMovie(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await MovieModel.deleteById(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found.'
      });
    }

    return res.json({
      success: true,
      message: 'Movie deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}
