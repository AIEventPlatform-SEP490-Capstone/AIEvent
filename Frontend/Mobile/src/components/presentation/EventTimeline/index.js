import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';

const EventTimeline = ({ 
  saleStartTime, 
  saleEndTime, 
  startTime, 
  endTime 
}) => {
  const [currentStage, setCurrentStage] = useState(0);

  const stages = [
    {
      label: 'Mở bán vé',
      time: saleStartTime 
        ? `${new Date(saleStartTime).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })} ${new Date(saleStartTime).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })}`
        : 'Chưa xác định',
      icon: '🎫',
    },
    {
      label: 'Đóng bán vé',
      time: saleEndTime 
        ? `${new Date(saleEndTime).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })} ${new Date(saleEndTime).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })}`
        : 'Chưa xác định',
      icon: '🔒',
    },
    {
      label: 'Sự kiện bắt đầu',
      time: `${new Date(startTime).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })} ${new Date(startTime).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })}`,
      icon: '🎉',
    },
    {
      label: 'Sự kiện kết thúc',
      time: `${new Date(endTime).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })} ${new Date(endTime).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })}`,
      icon: '✅',
    },
  ];

  useEffect(() => {
    const updateCurrentStage = () => {
      const now = new Date();
      
      if (saleStartTime && now < new Date(saleStartTime)) {
        setCurrentStage(-1); // Not yet started
      } else if (saleEndTime && now < new Date(saleEndTime)) {
        setCurrentStage(0); // Sale is ongoing
      } else if (now < new Date(startTime)) {
        setCurrentStage(1); // Sale closed, event not started
      } else if (now < new Date(endTime)) {
        setCurrentStage(2); // Event is ongoing
      } else {
        setCurrentStage(3); // Event has ended
      }
    };

    updateCurrentStage();
    const interval = setInterval(updateCurrentStage, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [saleStartTime, saleEndTime, startTime, endTime]);

  const getStageStyle = (index) => {
    if (index < currentStage) {
      return { backgroundColor: '#10b981' }; // Completed - green
    } else if (index === currentStage) {
      return { backgroundColor: '#3b82f6' }; // Current - blue
    } else {
      return { backgroundColor: '#e5e7eb' }; // Upcoming - gray
    }
  };

  const getLineStyle = (index) => {
    if (index < currentStage) {
      return { backgroundColor: '#10b981' }; // Completed - green
    } else {
      return { backgroundColor: '#e5e7eb' }; // Upcoming - gray
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Timeline sự kiện</Text>
      <View style={styles.timeline}>
        {stages.map((stage, index) => (
          <View key={index} style={styles.stageContainer}>
            <View style={styles.stageLeft}>
              <View style={[styles.stageDot, getStageStyle(index)]}>
                <Text style={styles.stageIcon}>{stage.icon}</Text>
              </View>
              {index < stages.length - 1 && (
                <View style={[styles.stageLine, getLineStyle(index)]} />
              )}
            </View>
            <View style={styles.stageRight}>
              <Text style={[
                styles.stageLabel,
                index === currentStage && styles.stageLabelActive
              ]}>
                {stage.label}
              </Text>
              <Text style={styles.stageTime}>{stage.time}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
  },
  stageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  stageLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  stageDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageIcon: {
    fontSize: 20,
  },
  stageLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: 4,
  },
  stageRight: {
    flex: 1,
    paddingTop: 8,
  },
  stageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  stageLabelActive: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  stageTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default EventTimeline;
