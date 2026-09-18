import mongoose from 'mongoose';
import { embeddedStore, isUsingEmbeddedStore } from '../config/database.js';

const seriesSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  poster: { type: String, required: true },
  backdrop: { type: String, required: true },
  genres: [{ type: String, required: true }],
  releaseYear: { type: Number, required: true },
  rating: { type: Number, default: 8.0 },
  featured: { type: Boolean, default: false },
  seasons: [
    {
      seasonNumber: { type: Number, default: 1 },
      episodes: [
        {
          episodeNumber: { type: Number, required: true },
          title: { type: String, required: true },
          duration: { type: Number, required: true },
          videoUrl: { type: String, required: true },
          description: { type: String }
        }
      ]
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

let MongooseSeriesModel;
try {
  MongooseSeriesModel = mongoose.model('Series', seriesSchema);
} catch (e) {
  MongooseSeriesModel = mongoose.models.Series;
}

export const SeriesModel = {
  async find(query = {}) {
    if (!isUsingEmbeddedStore() && mongoose.connection.readyState === 1) {
      return await MongooseSeriesModel.find(query);
    }
    return [...embeddedStore.series];
  },

  async findById(id) {
    if (!isUsingEmbeddedStore() && mongoose.connection.readyState === 1) {
      return await MongooseSeriesModel.findById(id);
    }
    return embeddedStore.series.find(s => s._id === id) || null;
  },

  async create(data) {
    if (!isUsingEmbeddedStore() && mongoose.connection.readyState === 1) {
      return await MongooseSeriesModel.create(data);
    }
    const newSeries = {
      _id: 'ser_' + Date.now(),
      ...data,
      seasons: data.seasons || [
        {
          seasonNumber: 1,
          episodes: [
            {
              episodeNumber: 1,
              title: 'Pilot Episode',
              duration: 45,
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
              description: 'The journey begins.'
            }
          ]
        }
      ]
    };
    embeddedStore.series.push(newSeries);
    return newSeries;
  },

  async updateById(id, data) {
    if (!isUsingEmbeddedStore() && mongoose.connection.readyState === 1) {
      return await MongooseSeriesModel.findByIdAndUpdate(id, data, { new: true });
    }
    const index = embeddedStore.series.findIndex(s => s._id === id);
    if (index === -1) return null;
    embeddedStore.series[index] = { ...embeddedStore.series[index], ...data };
    return embeddedStore.series[index];
  },

  async deleteById(id) {
    if (!isUsingEmbeddedStore() && mongoose.connection.readyState === 1) {
      return await MongooseSeriesModel.findByIdAndDelete(id);
    }
    const index = embeddedStore.series.findIndex(s => s._id === id);
    if (index === -1) return null;
    return embeddedStore.series.splice(index, 1)[0];
  },

  async countDocuments() {
    if (!isUsingEmbeddedStore() && mongoose.connection.readyState === 1) {
      return await MongooseSeriesModel.countDocuments();
    }
    return embeddedStore.series.length;
  }
};

export default SeriesModel;
