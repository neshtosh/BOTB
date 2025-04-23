import React from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { socialLinks } from '../data/socialData';
import SocialLinks from '../components/common/SocialLinks';
import Button from '../components/common/Button';

const About: React.FC = () => {
  return (
    <div className="container section pt-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            About the Artist
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-surface-300 mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae justo vitae metus tincidunt ultrices. 
                Nullam efficitur, magna id consequat ultrices, nibh lorem vestibulum nisi, a pharetra lorem odio at urna.
              </p>
              
              <p className="mb-4">
                Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. 
                Maecenas consequat libero vel lacus dapibus, in commodo nibh ultricies. 
                In hac habitasse platea dictumst. Nulla facilisi.
              </p>
              
              <p className="mb-6">
                Cras porttitor tristique eros, vel eleifend metus lacinia nec. Quisque in finibus felis. 
                Etiam iaculis nunc at nunc fringilla, et aliquam eros tincidunt. 
                Maecenas varius, tortor eu venenatis elementum, nibh enim eleifend justo, eu viverra odio velit at sem.
              </p>
              
              <h3 className="text-xl font-semibold mb-3">Press Inquiries</h3>
              <p className="mb-4">
                For press inquiries, interviews, or booking information, please contact our management team.
              </p>
              
              <Button 
                variant="primary" 
                leftIcon={<Mail size={16} />}
              >
                Contact Management
              </Button>
            </div>
          
            <div className="mt-12">
              <h3 className="text-xl font-semibold mb-4">Connect with the Artist</h3>
              <SocialLinks links={socialLinks} variant="filled" iconSize={24} className="gap-5" />
            </div>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative"
        >
          <div className="sticky top-24">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-6">
              <img 
                src="https://images.pexels.com/photos/1699161/pexels-photo-1699161.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="Artist portrait" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="rounded-xl bg-surface-200 border border-surface-300/30 p-6">
              <h3 className="text-xl font-semibold mb-4">Quick Facts</h3>
              <ul className="space-y-3">
                <li className="flex justify-between">
                  <span className="text-surface-600">Origin</span>
                  <span>Los Angeles, CA</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-surface-600">Genres</span>
                  <span>Electronic, Pop, R&B</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-surface-600">Active Since</span>
                  <span>2018</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-surface-600">Label</span>
                  <span>Independent</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
      
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">Discography Highlights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-3"
          >
            <h3 className="text-xl font-semibold">Albums</h3>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span>Neon Dreams</span>
                <span className="text-surface-600">2023</span>
              </li>
              <li className="flex justify-between">
                <span>Retrograde</span>
                <span className="text-surface-600">2021</span>
              </li>
              <li className="flex justify-between">
                <span>First Light</span>
                <span className="text-surface-600">2019</span>
              </li>
            </ul>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="space-y-3"
          >
            <h3 className="text-xl font-semibold">Top Singles</h3>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span>Midnight City</span>
                <span className="text-surface-600">2023</span>
              </li>
              <li className="flex justify-between">
                <span>Euphoria</span>
                <span className="text-surface-600">2023</span>
              </li>
              <li className="flex justify-between">
                <span>Golden Hour</span>
                <span className="text-surface-600">2022</span>
              </li>
              <li className="flex justify-between">
                <span>Electric Memories</span>
                <span className="text-surface-600">2021</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default About;