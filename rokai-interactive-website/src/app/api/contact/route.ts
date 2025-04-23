import { NextResponse } from 'next/server';
import { Message } from '@/models/Message';

// MongoDB connection utility is now imported dynamically in the route handler

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { name, email, message } = body;
    
    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { message: 'Name, email, and message are required' },
        { status: 400 }
      );
    }
    
    // Store in database (commented out for now since we don't have MongoDB set up)
    // For production, you would uncomment this and set up MongoDB
    /*
    // Connect to database
    const mongoose = require('mongoose');
    
    if (mongoose.connection.readyState < 1) {
      // Use environment variable for MongoDB URI in production
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rokai';
      
      try {
        await mongoose.connect(uri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
      } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        return NextResponse.json(
          { message: 'Database connection error' },
          { status: 500 }
        );
      }
    }
    
    // Create new message
    const newMessage = new Message({
      name,
      email,
      message,
      createdAt: new Date()
    });
    
    // Save to database
    await newMessage.save();
    */
    
    // For now, just log the message
    console.log('New message received:', { name, email, message });
    
    // Return success response
    return NextResponse.json(
      { message: 'Message received successfully!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in contact API:', error);
    return NextResponse.json(
      { message: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
