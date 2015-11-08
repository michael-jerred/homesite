using System.IO;
using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Hosting;
using Microsoft.AspNet.Mvc.Formatters;
using Microsoft.Dnx.Runtime;
using Microsoft.Framework.Configuration;
using Microsoft.Framework.DependencyInjection;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Serialization;
using System.Linq;

namespace Homesite.Web
{
    public class Startup
    {
        private IConfigurationRoot Configuration { get; set; }

        public Startup(IHostingEnvironment env, IApplicationEnvironment appEnv)
        {
            /*
             * Load server configuration e.g. db connection string
             */

            var configBuilder = new ConfigurationBuilder()
                .AddJsonFile(Path.Combine(appEnv.ApplicationBasePath, "Config", $"config-{env.EnvironmentName}.json"))
                .AddEnvironmentVariables();

            Configuration = configBuilder.Build();
        }

        public void ConfigureServices(IServiceCollection services)
        {
            /*
             * Configure MVC options
             */

            services.AddMvc(options =>
                {
                    // configure json response format for the API routes
                    var jsonFormatterSettings = options.OutputFormatters.OfType<JsonOutputFormatter>().First().SerializerSettings;
                    jsonFormatterSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
                    jsonFormatterSettings.DateFormatHandling = DateFormatHandling.IsoDateFormat;

                    //options.Filters.Add(new RequireHttpsAttribute());
                    jsonFormatterSettings.DateTimeZoneHandling = DateTimeZoneHandling.Utc;
                    // and enums to strings
                    jsonFormatterSettings.Converters.Add(new StringEnumConverter());
                });

            /*
             * Register config and other things with DI
             */


        }

        // Configure is called after ConfigureServices is called.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            /*
             * Add all middleware to the pipeline in the order we want them to run
             */

            app.UseStaticFiles("/wwwroot");
            app.UseMvc();
        }
    }
}
