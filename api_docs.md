# Sanad System API Documentation

The Sanad system is a ROS 2-based smart home robot framework that provides high-level control over home automation, navigation, and room management.

---

## 🏠 Smart Home API

The Smart Home API enables interaction with connected devices and conversational AI features.

### Topics

| Topic | Type | Description |
| :--- | :--- | :--- |
| `/robot/smarthome_command` | `std_msgs/String` | Outgoing commands for smart home devices (JSON formatted). |
| `/robot/voice_command` | `std_msgs/String` | Incoming transcribed voice commands from the Whisper node. |
| `/robot/speak` | `std_msgs/String` | Outgoing text-to-speech requests for the robot's voice. |

### Smart Home Command Format (JSON)
When sending commands to `/robot/smarthome_command`, use the following structure:
```json
{
  "controls": [
    {
      "target": "ac", 
      "action": "turn_on"
    }
  ]
}
```

---

## 📍 Navigation API

The Navigation API provides both high-level room-based navigation and standard coordinate-based navigation.

### Services

| Service | Type | Description |
| :--- | :--- | :--- |
| `rooms/navigate` | `sanad_interfaces/srv/NavigateToRoom` | Navigates the robot to a predefined room by name. |

### Actions (Nav2)

| Action | Type | Description |
| :--- | :--- | :--- |
| `navigate_to_pose` | `nav2_msgs/action/NavigateToPose` | Standard Nav2 action for navigating to specific [x, y, theta] coordinates. |

---

## 🚪 Rooms API

The Rooms API manages the persistent storage and retrieval of room definitions and their associated devices.

### Services

| Service | Type | Description |
| :--- | :--- | :--- |
| `rooms/get` | `sanad_interfaces/srv/GetRoom` | Retrieve a specific room's data by name. |
| `rooms/get_all` | `sanad_interfaces/srv/GetAllRooms` | Retrieve a list of all defined rooms. |
| `rooms/add` | `sanad_interfaces/srv/AddRoom` | Define a new room in the system. |
| `rooms/update` | `sanad_interfaces/srv/UpdateRoom` | Update an existing room's data or devices. |
| `rooms/delete` | `sanad_interfaces/srv/DeleteRoom` | Remove a room from the system. |
| `devices/register` | `sanad_interfaces/srv/RegisterDevice` | Register a new device to a specific room. |
| `devices/delete` | `sanad_interfaces/srv/DeleteDevice` | Remove a device from its room. |

---

## 🧩 Segmentation (Spatial Partitioning)

The system uses a bounding-box-based segmentation strategy to partition the environment into semantic areas (rooms).

### Room Definition Structure (`Room.msg`)
Each room segment is defined by:
- **Spatial Bounds**: `min_x`, `max_x`, `min_y`, `max_y` (meters).
- **Navigation Goal**: `pose_x`, `pose_y`, `pose_theta` (The target coordinate when navigating to this room).
- **Orientation**: `theta` (General orientation of the room area).
- **Devices**: A list of `Device` objects located within these bounds.

### Data Persistence
Room segments and device configurations are persisted in `sanad_room_manager/config/rooms.yaml`. Changes made via the API are automatically saved to this file.

---

## 🛠️ Data Types

### `sanad_interfaces/msg/Room`
```text
string room_name
float64 min_x
float64 max_x
float64 min_y
float64 max_y
float64 theta
float64 pose_x
float64 pose_y
float64 pose_theta
sanad_interfaces/Device[] devices
```

### `sanad_interfaces/msg/Device`
```text
string id
string name
string type
string[] action        # e.g., ["turn_on", "turn_off"]
string[] state_keys    # e.g., ["power", "brightness"]
string[] state_values  # e.g., ["on", "24"]
```
