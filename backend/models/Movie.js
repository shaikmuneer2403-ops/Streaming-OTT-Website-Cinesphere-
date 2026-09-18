import mongoose from 'mongoose';
import { embeddedStore, isUsingEmbeddedStore } from '../config/database.js';

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  poster: { type: String, required: true },
  backdrop: { type: String, required: true },
  videoUrl: { type: String, required: true },
  trailerUrl: { type: String },
  genres: [{ type: String, required: true }],
  cast: [{ type: String }],
  director: { type: String },
  releaseYear: { type: Number, required: true },
  duration: { type: Number, required: true }, // in minutes
  rating: { type: Number, default: 7.5 },
  views: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  ageRating: { type: String, default: 'PG-13' },
  language: { type: String, default: 'English' },
  createdAt: { type: Date, default: Date.now }
});

let MongooseMovieModel;
try {
  MongooseMovieModel = mongoose.model('Movie', movieSchema);
} catch (e) {
  MongooseMovieModel = mongoose.models.Movie;
}

export const MovieModel = {
  async find({ genre, search, year, sort, limit = 50, featured } = {}) {
    if (!isUsingEmbeddedStore() && mongoose.connection.readyState === 1) {
      const q = {};
      if (genre) q.genres = genre;
      if (year) q.releaseYear = Number(year);
      if (featured !== undefined) q.featured = featured;
      if (search) {
        q.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { cast: { $regex: search, $options: 'i' } },
          { director: { $regex: search, $options: 'i' } }
        ];
      }
      let query = MongooseMovieModel.find(q);
      if (sort === 'rating') query = query.sort({ rating: -1 });
      else if (sort === 'newest') query = query.sort({ releaseYear: -1, createdAt: -1 });
      else if (sort === 'views') query = query.sort({ views: -1 });
      else query = query.sort({ views: -1 });
      return await query.limit(Number(limit));
    }

    let list = [...embeddedStore.movies];
    if (genre && genre !== 'All') {
      list = list.filter(m => m.genres.some(g => g.toLowerCase() === genre.toLowerCase()));
    }
    if (year) {
      list = list.filter(m => m.releaseYear === Number(year));
    }
    if (featured !== undefined) {
      list = list.filter(m => m.featured === Boolean(featured));
    }
    if (search && search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(m =>
        m.title.toLowerCase().includes(term) ||
        m.description.toLowerCase().includes(term) ||
        m.genres.some(g => g.toLowerCase().includes(term)) ||
        (m.cast && m.cast.some(c => c.toLowerCase().includes(term))) ||
        (m.director && m.director.toLowerCase().includes(term))
      );
    }
    if (sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'newest') {
      list.sort((a, b) => b.releaseYear - a.releaseYear);
    } else if (sort === 'views') {
      list.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else {
      list.sort((a, b) => (b.views || 0) - (a.views || 0));
    }
    return list.slice(0, Number(limit));
  },

  async findById(id) {
    if (!isUsingEmbeddedStore() && mongoose.connection.readyState === 1) {
      return await MongooseMovieModel.findById(id);
    }
    return embeddedStore.movies.find(m => m._id === id) || null;
  },

  async incrementViews(id) {
    if (!isUsingEmbeddedStore() && mongoose.connection.readyState === 1) {
      return await MongooseMovieModel.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
    }
    const movie = embeddedStore.movies.find(m => m._id === id);
    if (movie) {
      movie.views = (movie.views || 0) + 1;
    }
    return movie;
  },

  async create(movieData) {
    if (!isUsingEmbeddedStore() && mongoose.connection.readyState === 1) {
      return await MongooseMovieModel.create(movieData);
    }
    const newMovie = {
      _id: 'mov_' + Date.now(),
      title: movieData.title,
      description: movieData.description,
      poster: movieData.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
      backdrop: movieData.backdrop || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&auto=format&fit=crop&q=80',
      videoUrl: movieData.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      trailerUrl: movieData.trailerUrl || movieData.videoUrl,
      genres: Array.isArray(movieData.genres) ? movieData.genres : [movieData.genres || 'Action'],
      cast: Array.isArray(movieData.cast) ? movieData.cast : (typeof movieData.cast === 'string' ? movieData.cast.split(',').map(s => s.trim()) : ['Lead Cast']),
      director: movieData.director || 'Studio Director',
      releaseYear: Number(movieData.releaseYear) || new Date().getFullYear(),
      duration: Number(movieData.duration) || 120,
      rating: Number(movieData.rating) || 8.0,
      views: 0,
      featured: Boolean(movieData.featured),
      ageRating: movieData.ageRating || 'PG-13',
      language: movieData.language || 'English',
      createdAt: new Date().toISOString()
    };
    embeddedStore.movies.unshift(newMovie);
    return newMovie;
  },

  async updateById(id, movieData) {
    if (!isUsingEmbeddedStore() && mongoose.connection.readyState === 1) {
      return await MongooseMovieModel.findByIdAndUpdate(id, movieData, { new: true });
    }
    const index = embeddedStore.movies.findIndex(m => m._id === id);
    if (index === -1) return null;
    embeddedStore.movies[index] = {
      ...embeddedStore.movies[index],
      ...movieData
    };
    return embeddedStore.movies[index];
  },

  async deleteById(id) {
    if (!isUsingEmbeddedStore() && mongoose.connection.readyState === 1) {
      return await MongooseMovieModel.findByIdAndDelete(id);
    }
    const index = embeddedStore.movies.findIndex(m => m._id === id);
    if (index === -1) return null;
    return embeddedStore.movies.splice(index, 1)[0];
  },

  async countDocuments(query = {}) {
    if (!isUsingEmbeddedStore() && mongoose.connection.readyState === 1) {
      return await MongooseMovieModel.countDocuments(query);
    }
    return embeddedStore.movies.length;
  }
};

export default MovieModel;
