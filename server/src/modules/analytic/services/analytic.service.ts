import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  SensorLog,
  SensorLogDocument,
} from '../../monitor/schemas/sensor-log.schema';

import {
  PumpLog,
  PumpLogDocument,
} from '../../monitor/schemas/pump-log.schema';

import {
  GetTelemetryTrendDto,
  TimeResolution,
} from '../dto/get-telemetry-trend.dto';

import { GetPumpStatsDto } from '../dto/get-pump-stats.dto';

@Injectable()
export class AnalyticService {
  constructor(
    @InjectModel(SensorLog.name)
    private sensorLogModel: Model<SensorLogDocument>,

    @InjectModel(PumpLog.name)
    private pumpLogModel: Model<PumpLogDocument>,
  ) {}

  async getTelemetryTrend(
    dto: GetTelemetryTrendDto,
  ) {
    const {
      deviceId,
      startDate,
      endDate,
      resolution,
    } = dto;

    let dateFormat = '%Y-%m-%d';

    if (resolution === TimeResolution.HOUR) {
      dateFormat = '%Y-%m-%d %H:00';
    }

    if (resolution === TimeResolution.WEEK) {
      dateFormat = '%Y-%U';
    }

    return this.sensorLogModel.aggregate([
      {
        $match: {
          deviceId,
          timestamp: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: '$timestamp',
              timezone: '+07:00',
            },
          },

          avgTemperature: {
            $avg: '$data.temp',
          },

          avgSoilMoisture: {
            $avg: '$data.soil',
          },

          avgHumidity: {
            $avg: '$data.humid',
          },

          avgLight: {
            $avg: '$data.light',
          },

          dataPoints: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]);
  }

  async calculatePumpStats(dto: GetPumpStatsDto) {
    const { deviceId, startDate, endDate } = dto;

    const stats = await this.pumpLogModel.aggregate([
      {
        $match: {
          deviceId,
          timestamp: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalActivations: { $sum: 1 },
          totalDurationMs: { $sum: '$durationMs' },
        },
      },
    ]);

    return stats.length > 0 ? stats[0] : { totalActivations: 0, totalDurationMs: 0 };
  }

  async getPumpLogsWithPagination(dto: GetPumpStatsDto) {
    const { deviceId, startDate, endDate, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const queryFilter: any = {
      deviceId,
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    const logs = await this.pumpLogModel
      .find(queryFilter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const total = await this.pumpLogModel.countDocuments(queryFilter);

    return {
      success: true,
      data: logs.map((log) => ({
        id: log._id,
        deviceId: log.deviceId,
        mac: log.mac,
        durationMs: log.durationMs,
        source: log.source,
        timestamp: log.timestamp,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLatestTelemetry(deviceId: string) {
    const latestLog = await this.sensorLogModel
      .findOne({ deviceId })
      .sort({ timestamp: -1 })
      .lean()
      .exec();

    if (!latestLog) {
      return {
        success: false,
        message: 'No data for this device',
        data: null,
      };
    }

    return {
      success: true,

      deviceId: latestLog.deviceId,

      timestamp: latestLog.timestamp,

      readings: {
        soilMoisture: latestLog.data.soil,
        temperature: latestLog.data.temp,
        humidity: latestLog.data.humid,
        light: latestLog.data.light,
      },
    };
  }

async getTelemetryHistory(dto: GetPumpStatsDto) {
    const { deviceId, startDate, endDate, page = 1, limit = 50 } = dto;
    const skip = (page - 1) * limit;

    const queryFilter: any = {
      deviceId,
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    const logs = await this.sensorLogModel
      .find(queryFilter)
      .sort({ timestamp: -1 }) 
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const total = await this.sensorLogModel.countDocuments(queryFilter);

    return {
      success: true,
      data: logs.map((log) => ({
        id: log._id,
        deviceId: log.deviceId,
        mac: log.mac,
        timestamp: log.timestamp,
        readings: {
          soilMoisture: log.data?.soil ?? null,
          temperature: log.data?.temp ?? null,
          humidity: log.data?.humid ?? null,
          light: log.data?.light ?? null,
        },
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async seedFakeData(deviceId: string) {
    await this.sensorLogModel.deleteMany({
      deviceId,
    });

    await this.pumpLogModel.deleteMany({
      deviceId,
    });

    const sensorLogs: any[] = [];
    const pumpLogs: any[] = [];

    const now = new Date();

    for (let day = 30; day >= 0; day--) {
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date(
          now.getTime() -
            day * 24 * 60 * 60 * 1000,
        );

        timestamp.setHours(hour, 0, 0, 0);

        sensorLogs.push({
          deviceId,

          mac: '00:1B:44:11:3A:B7',

          data: {
            soil: 30 + Math.random() * 50,
            temp: 25 + Math.random() * 10,
            humid: 50 + Math.random() * 30,
            light: 1000 + Math.random() * 1000,
          },

          timestamp,
        });

        if (Math.random() > 0.8) {
          pumpLogs.push({
            deviceId,

            mac: '00:1B:44:11:3A:B7',

            durationMs:
              5000 +
              Math.floor(
                Math.random() * 10000,
              ),

            source: 'ENV',

            timestamp: new Date(
              timestamp.getTime() +
                Math.random() * 3600000,
            ),
          });
        }
      }
    }

    await this.sensorLogModel.insertMany(
      sensorLogs,
    );

    await this.pumpLogModel.insertMany(
      pumpLogs,
    );

    return {
      message:
        'Fake data generated successfully',

      sensorRecords: sensorLogs.length,

      pumpRecords: pumpLogs.length,
    };
  }
}