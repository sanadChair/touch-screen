import * as ROSLIB from "roslib";
import type { IMapService } from "./IMapService";
import type { OccupancyGrid, RobotPose } from "../types";
import { RosService } from "../../../shared/lib/RosService";

export class NativeMapService implements IMapService {
  private ros: ROSLIB.Ros;
  private mapTopic: ROSLIB.Topic<any>;
  private poseTopic: ROSLIB.Topic<any>;
  private navigationActionClient: ROSLIB.ActionClient;
  private lastStamp: { sec: number; nanosec: number } | null = null;

  constructor() {
    const rosService = RosService.getInstance();
    this.ros = rosService.getRos();
    console.info(
      `NativeMapService: using shared ROS connection at ${rosService.getUrl()}`,
    );

    this.mapTopic = new ROSLIB.Topic({
      ros: this.ros,
      name: "/map",
      messageType: "nav_msgs/OccupancyGrid",
      compression: "png",
    });

    this.poseTopic = new ROSLIB.Topic({
      ros: this.ros,
      name: "/amcl_pose",
      messageType: "geometry_msgs/msg/PoseWithCovarianceStamped",
    });

    this.navigationActionClient = new ROSLIB.ActionClient({
      ros: this.ros,
      serverName: "/navigate_to_pose",
      actionName: "nav2_msgs/action/NavigateToPose",
    });
  }

  onMapUpdate(callback: (map: OccupancyGrid) => void): void {
    console.log("NativeMapService: subscribing to map updates");

    this.mapTopic.subscribe((message: any) => {
      const grid: OccupancyGrid = {
        header: message.header,
        info: message.info,
        data: message.data,
      };

      callback(grid);
    });
  }

  onRobotPoseUpdate(callback: (pose: RobotPose) => void): void {
    this.poseTopic.subscribe((message: any) => {
      if (message.header && message.header.stamp) {
        this.lastStamp = message.header.stamp;
      }

      try {
        const x = message.pose.pose.position.x;
        const y = message.pose.pose.position.y;

        const q = message.pose.pose.orientation;
        const sinyCosp = 2 * (q.w * q.z + q.x * q.y);
        const cosyCosp = 1 - 2 * (q.y * q.y + q.z * q.z);
        const rotation = Math.atan2(sinyCosp, cosyCosp);
        callback({ x, y, rotation });
      } catch (err) {
        console.error("NativeMapService: failed to parse robot_pose", err);
      }
    });
  }

  setGoal(x: number, y: number): void {
    console.log(`NativeMapService: sending Nav2 goal x=${x}, y=${y}`);

    const stamp =
      this.lastStamp && this.lastStamp.sec !== 0
        ? this.lastStamp
        : { sec: Math.floor(Date.now() / 1000), nanosec: 0 };

    const goal = new ROSLIB.Goal({
      actionClient: this.navigationActionClient,
      goalMessage: {
        pose: {
          header: {
            frame_id: "map",
            stamp,
          },
          pose: {
            position: { x, y, z: 0.0 },
            orientation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 },
          },
        },
      },
    });

    goal.on("feedback", (feedback) => {
      console.log("NativeMapService: navigation feedback", feedback);
    });

    goal.on("result", (result) => {
      console.log("NativeMapService: navigation result", result);
    });

    goal.send();
  }

  dispose(): void {
    console.log("NativeMapService disposed");
  }
}
