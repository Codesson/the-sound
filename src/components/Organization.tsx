import React from "react";
import organizationImage from "../assets/images/organization.png";

export default function Organization() {
  return (
    <section className="flex flex-col justify-center items-center py-20">
      <h2 className="w-fit mt-20">조직도</h2>
      <div className="relative w-[90vw] min-h-[50vw]">
        <img
          src={organizationImage}
          alt="조직도"
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: "contain", 
            paddingLeft: 10,
            position: 'absolute'
          }}
        />
      </div>
    </section>
  );
}
