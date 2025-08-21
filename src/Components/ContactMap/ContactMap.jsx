
function ContactMap() {
  return (
    <div className='contactMap'>
      <iframe
        title='mapa de ubicacion de cofa'
        src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3283.6642461889455!2d-58.39205192346286!3d-34.61265075797143!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bccadc7b4f6f15%3A0x1ebf6b574c304c4e!2sCOFA%20Servicios%20Financieros!5e0!3m2!1ses-419!2sar!4v1698991210573!5m2!1ses-419!2sar'
        style={{ border: "0" }}
        allowFullScreen=''
        loading='lazy'
        className='contactMap'
      ></iframe>
    </div>
  );
}

export default ContactMap;
