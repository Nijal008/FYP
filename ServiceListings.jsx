import React from 'react';
import { useNavigate } from 'react-router-dom';
import webDeveloper from './images/webdeveloper.jpg';
import cleaning from './images/Cleaning.jpg';
import photographer from './images/photographer.jpg';
import electrician from './images/electrician.jpg';
import plumber from './images/plumber.jpg';
import graphicDesigner from './images/graphicdesigner.jpg';
import chooseBanner from './images/chooseservices.png';

const ServiceListings = () => {
  const navigate = useNavigate();

  // Array of service data
  const services = [
    { id: 1, name: 'Web Developer', image: webDeveloper },
    { id: 2, name: 'House Cleaner', image: cleaning },
    { id: 3, name: 'Photography', image: photographer },
    { id: 4, name: 'Electrician', image: electrician },
    { id: 5, name: 'Plumber', image: plumber },
    { id: 6, name: 'Graphic Designer', image: graphicDesigner },
  ];

  // Function to handle service selection
  const handleServiceSelect = (serviceId, serviceName) => {
    // Navigate to service provider list with serviceId as a query parameter
    navigate(`/service-providers?serviceId=${serviceId}`, { 
      state: { 
        serviceId, 
        serviceName 
      } 
    });
  };

  return (
    <div className="services-page">
      <div className="services-banner">
        <img src={chooseBanner} alt="Choose Services" />
       
      </div>

      <div className="services-grid">
        {services.map((service) => (
          <div 
            key={service.id} 
            className="service-card"
            onClick={() => handleServiceSelect(service.id, service.name)}
          >
            <img src={service.image} alt={service.name} />
            <h3>{service.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceListings;