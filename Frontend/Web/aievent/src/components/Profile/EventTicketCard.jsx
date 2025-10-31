import React from 'react';
import { Calendar, MapPin, QrCode, Eye, Clock, Ticket, Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const EventTicketCard = ({ ticket, onViewQR, onViewDetails }) => {
  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 bg-white group relative">
      {/* Gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" style={{ padding: '2px' }}>
        <div className="bg-white h-full w-full rounded-xl"></div>
      </div>
      
      <div className="relative flex flex-col md:flex-row">
        {/* Enhanced Event Image with overlay effects */}
        <div className="relative w-full md:w-56 h-48 md:h-auto bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center overflow-hidden">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/90 via-purple-600/90 to-pink-600/90 group-hover:scale-110 transition-transform duration-700"></div>
          
          {/* Animated circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-300/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-1000" style={{ animationDelay: '0.3s' }}></div>
          
          {/* Ticket icon with animation */}
          <div className="relative z-10 text-center text-white group-hover:scale-110 transition-transform duration-500">
            <div className="relative">
              <Ticket className="w-16 h-16 mx-auto mb-3 opacity-90 group-hover:rotate-12 transition-transform duration-500" />
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <div className="text-sm font-bold opacity-90 tracking-wider">EVENT TICKET</div>
            <div className="text-xs opacity-70 mt-1">Valid Entry Pass</div>
          </div>
          
          {/* Decorative corner elements */}
          <div className="absolute top-3 right-3 w-10 h-10 border-2 border-white/30 rounded-tr-xl"></div>
          <div className="absolute bottom-3 left-3 w-10 h-10 border-2 border-white/30 rounded-bl-xl"></div>
          
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
        </div>

        <div className="flex-1 p-6 md:p-8 relative">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100"></div>
          </div>
          
          <div className="relative">
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                  {ticket.name}
                </h3>
                <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 px-4 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="w-2.5 h-2.5 bg-white rounded-full mr-2 animate-pulse"></div>
                  {ticket.status}
                </Badge>
              </div>
              
              {/* Decorative corner accent */}
              <div className="hidden md:block w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-bl-3xl opacity-50"></div>
            </div>

            <div className="space-y-4 mb-8">
              {/* Date and Time */}
              <div className="group/item flex items-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-blue-100">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-gray-900 text-lg">{ticket.date}</span>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-gray-700">{ticket.time}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Location */}
              <div className="group/item flex items-start bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-rose-100">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center mr-4 shadow-lg flex-shrink-0 group-hover/item:scale-110 transition-transform duration-300">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 pt-1">
                  <span className="text-gray-700 leading-relaxed font-medium">{ticket.location}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="flex-1 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-700 hover:via-blue-800 hover:to-purple-800 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-6 font-bold text-base group/btn relative overflow-hidden"
                onClick={() => onViewQR(ticket.id)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-700"></div>
                <QrCode className="w-5 h-5 mr-3 relative z-10 group-hover/btn:scale-110 transition-transform duration-300" />
                <span className="relative z-10">Xem mã QR</span>
                <ArrowRight className="w-5 h-5 ml-3 relative z-10 group-hover/btn:translate-x-1 transition-transform duration-300" />
              </Button>
              
              <Button 
                variant="outline"
                className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-400 transition-all duration-300 px-8 py-6 font-bold text-base group/btn shadow-md hover:shadow-lg"
                onClick={() => onViewDetails(ticket.id)}
              >
                <Eye className="w-5 h-5 mr-3 group-hover/btn:scale-110 transition-transform duration-300" />
                <span>Chi tiết sự kiện</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </Card>
  );
};

export default EventTicketCard;