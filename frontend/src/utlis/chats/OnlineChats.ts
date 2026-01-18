
export const initTawkWidget = () => {
    return `
      var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
      (function(){
        var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
        s1.async=true;
        s1.src='https://embed.tawk.to/6780f63c49e2fd8dfe058a1a/1ih7s3n3p';
        s1.charset='UTF-8';
        s1.setAttribute('crossorigin','*');
        s0.parentNode.insertBefore(s1,s0);
      })();
    `;
  };
  
   
  export const initWhatsAppWidget = (phoneNumber: string) => {
    return `
      (function() {
        // Create container
        var container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.bottom = '90px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        
        // Create button
        var button = document.createElement('a');
        var message = encodeURIComponent("Hi Daud! I found your website and have a question.");
        button.href = 'https://wa.me/${phoneNumber}?text=' + message;
        button.target = '_blank';
        button.rel = 'noopener noreferrer';
        button.style.display = 'block';
        button.style.width = '60px';
        button.style.height = '60px';
        button.style.borderRadius = '50%';
        button.style.backgroundColor = '#25D366';
        button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.transition = 'all 0.3s ease';
        
        // WhatsApp icon using SVG
        button.innerHTML = \`<svg width="30" height="30" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>\`;
  
        // Button hover effects
        button.onmouseover = function() {
          this.style.transform = 'scale(1.1)';
        };
        button.onmouseout = function() {
          this.style.transform = 'scale(1)';
        };
        
        // Append button to container and container to body
        container.appendChild(button);
        document.body.appendChild(container);
      })();
    `;
  };
 
  export const CHAT_CONFIG = {
    WHATSAPP_NUMBER: '+995557442212',  
    TAWK_PROPERTY_ID: '6780f63c49e2fd8dfe058a1a',
    TAWK_WIDGET_ID: '1ih7s3n3p'
  };